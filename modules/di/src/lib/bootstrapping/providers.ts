import { GetOpt, GetOptOption, GetOptConfiguration } from '@tna/getopt';
import { ConfigurationProvider, Configuration } from './configurations';
import { OnConfigure, OnInit, OnReady, OnDestroy } from './hooks';
import { BootstrapPhaseError, MissingDeclarationError, MissingConfigurationError, UnspecificConfigError } from '../errors';
import { IInjectable, IApplication } from './hooks/injectable';
import { Logger } from '@tna/logger';

export interface ProviderOptions {
    // logger?: ConsoleLogger;
    configurations?: Configuration<any>[];
}

export interface TemplatePackage {
    template: any;
    provides: string;
    constructorArgs: string[];
    multiIds: { token: string, id: string }[];
}

export declare type HookState =
    "unset"
    | "configuring"
    | "configured"
    | "initializing"
    | "initialized"
    | "ready"
    | "destroying"
    | "destroyed";

export interface InstancePackage<T> {
    provides: string;
    instance: T;
    id: string;
    consumes: { token: string; id: null }[];
    initState: HookState;
}

export class Providers {

    private instances: InstancePackage<any>[] = [];
    private templates: TemplatePackage[] = [];
    private getopt: GetOpt;
    private configurations: Configuration<any>[] = [];
    private logger = Logger.build()
        .className('Providers')
        .create();

    constructor(private options?: ProviderOptions) {
        this.options = Object.assign({
            logger: null,
            options: [],
            configurations: [],
        } as ProviderOptions, options);

        // if (!this.options.logger) {
        //     this.options.logger = new ConsoleLogger("spam");
        // }

        this.configurations = this.options.configurations;

        this.instances.push({
            consumes: [],
            id: null,
            initState: "unset",
            instance: this,
            provides: "Providers"
        });

        // if (options.logger) {
        //     options.logger.registerLogger(this.logger);
        // }
    }

    createGetOpt(options: GetOptConfiguration) {
        let getopt = new GetOpt(options);
        this.getopt = getopt;

        this.instances.push({
            consumes: [],
            id: null,
            initState: "unset",
            instance: getopt,
            provides: "GetOpt"
        });
    }

    async setupShutdownHook() {
        let shutting_down = false;

        // process.on("beforeExit", callShutdown);
        process.removeAllListeners("SIGTERM");
        process.on("SIGTERM", () => {
            this.logger.info("SIGTERM");
            callShutdown();
        });
        process.removeAllListeners("SIGINT");
        process.on("SIGINT", () => {
            this.logger.info("SIGINT");
            callShutdown();
        });


        const self = this;

        function callShutdown() {

            if (shutting_down) {
                self.logger.warn(`Ignoring shutdown call! Already shutting down.`);
                return;
            }

            shutting_down = true;

            self.destroyInstances()
                .then(_ => {
                    self.logger.info(`exiting`);
                    process.exit(0);
                });
        }
    }

    async configureInstances() {
        this.logger.info(`Configuring ${this.instances.length} instances.`);

        // set all getopt options before collecting configs
        for (const instance of this.instances as InstancePackage<OnConfigure>[]) {
            if (instance.instance.__tna_di_getopt_options__) {
                for (let option of instance.instance.__tna_di_getopt_options__) {
                    this.logger.spam(`setting key "${option.target}" on "${instance.provides}" from getopt option "${option.getOptKey}"`);
                    const value = this.getopt.options[option.getOptKey];
                    (instance.instance as any)[option.target] = value;
                }
            }
            if (instance.instance.__tna_di_getopt_arguments__) {
                for (let option of instance.instance.__tna_di_getopt_arguments__) {
                    this.logger.spam(`setting key "${option.target}" on "${instance.provides}" from getopt argument "${option.getOptKey}"`);
                    let keySplit = option.getOptKey.split('.');
                    let value = this.getopt.posTree[keySplit.shift()];
                    
                    for (let arg of keySplit) {
                        value = value[arg];
                    }
                    (instance.instance as any)[option.target] = value;
                }
            }
        }

        // reverse instances to configure from "outside" to "inside"
        const reversed_instances = [...this.instances].reverse();

        await this.applyConfigurations(reversed_instances);

        this.logger.info(`Done configuring.`);
    }

    private async applyConfigurations(instances: InstancePackage<OnConfigure & ConfigurationProvider & IInjectable>[]): Promise<void> {

        for (const instance of instances) {
            await this.applyConfiguration(instance);
        }

    }

    private async applyConfiguration(instance: InstancePackage<OnConfigure & ConfigurationProvider & IInjectable>): Promise<void> {
        if (instance.initState !== "unset") {
            throw new BootstrapPhaseError(`Trying to configure "${instance.provides}${instance.id ? '" with id "' + instance.id : ''}" which has already been touched.`);
        }


        const matching_conf = this.configurations
            .find(conf =>
                conf.forModule == instance.provides
                && conf.id == instance.id
            );

        const conf_key_package = instance.instance.__tna_di_configuration_key__;

        if (conf_key_package && !matching_conf && !conf_key_package.defaultConfiguration) {

            const err_text = `"${instance.provides}" ` +
                (instance.id ? 'with id "' + instance.id + '" ' : "") +
                "requests configuration, but none is present!";

            throw new MissingConfigurationError(err_text);

        }

        instance.initState = "configuring";

        if (conf_key_package) {
            (instance.instance as any)[conf_key_package.propertyKey] = Object.assign(
                conf_key_package.defaultConfiguration,
                (instance.instance as any)[conf_key_package.propertyKey] || {},
                matching_conf && matching_conf.config || {}
            );

        }


        if (typeof instance.instance.onConfigure == "function") {


            this.logger.spam(`Starting to configure "${instance.provides}${instance.id ? '" with id "' + instance.id : ''}".`);

            await instance.instance.onConfigure.apply(instance.instance);

            this.logger.spam(`"${instance.provides}${instance.id ? '" with id "' + instance.id : ''}" is configured.`);
        }

        instance.initState = "configured";

        if (typeof (instance.instance as ConfigurationProvider).onProvideConfigurations == "function") {
            const configs = await instance.instance.onProvideConfigurations.apply(instance.instance);

            const maps = instance.instance.__tna_di_config_id_map__;
            if (maps) {
                for (let conf of configs) {
                    if (Object.keys(maps).indexOf(conf.id) > -1) {
                        conf.id = maps[conf.id];
                    }
                }
            }

            this.configurations = [
                ...this.configurations,
                ...configs
            ];
        }
        return;
    }

    async initInstances() {

        this.logger.info(`Initializing ${this.instances.length} instances.`);

        for (let instance of this.instances as InstancePackage<OnInit>[]) {
            if (instance.initState !== "configured") {
                if (instance.initState == "unset") {
                    await this.applyConfiguration(instance as any);
                } else {
                    throw new BootstrapPhaseError(`Trying to init "${instance.provides}"${instance.id ? ' with id "' + instance.id : '"'} although it has already been initialized.`);
                }
            }

            instance.initState = "initializing";

            if (typeof instance.instance.onInit == "function") {

                this.logger.spam(`Starting to initialize "${instance.provides}${instance.id ? '" with id "' + instance.id : ''}"`);
                await instance.instance.onInit.apply(instance.instance);

                this.logger.spam(`"${instance.provides}${instance.id ? '" with id "' + instance.id : ''}" is initialized`);

            }
            instance.initState = "initialized";
        }

        this.logger.info(`initialization complete`);
    }

    announceReady() {
        this.logger.info(`Announcing ready state to ${this.instances.length} instances.`);


        for (let instance of this.instances as InstancePackage<OnReady>[]) {
            if (instance.initState !== "initialized") {
                throw new BootstrapPhaseError(`Trying to announce ready state to "${instance.provides}"${instance.id ? ' with id "' + instance.id + '"' : ''} although it is not initialized yet.`);
            }

            // if (this.options.log) {
            //     console.log(`DI: ... announcing ready to "${instance.provides}"${instance.id ? ' with id "' + instance.id + '"' : ''} ...`);
            // }

            if (typeof instance.instance.onReady == "function") {
                instance.instance.onReady();
            }
            instance.initState = "ready";

            // if (this.options.log) {
            //     console.log(`DI: ... "${instance.provides}"${instance.id ? ' with id "' + instance.id + '"' : ''} is ready ...`);
            // }
        }
    }

    async destroyInstances() {
        this.logger.info(`Destroying ${this.instances.length} instances.`);

        for (let instance of this.instances as InstancePackage<OnDestroy>[]) {

            if (instance.initState === "destroyed") {
                throw new BootstrapPhaseError(`Trying to destroy "${instance.provides}"${instance.id ? ' with id "' + instance.id : ''}" although it is already destroyed.`);
            }

            if (instance.initState === "destroying") {
                throw new BootstrapPhaseError(`Trying to destroy "${instance.provides}"${instance.id ? ' with id "' + instance.id : ''}" although it is already beeing destroyed.`);
            }

            instance.initState = "destroying";

            if (typeof instance.instance.onDestroy == "function") {
                await instance.instance.onDestroy();
            }

            instance.initState = "destroyed";
        }

    }



    gimme(instance: string, caller: string): any
    gimme(instance: any, caller: string): any
    gimme(instance: string | any, caller: string, id: string): any
    gimme<T>(instance: string | any, caller: string): T
    gimme<T>(instance: string | any, caller: string, id: string): T
    gimme<T>(instance: string | any, caller: string, id: string, callerId: string): T
    gimme<T>(instance: string | any, caller: string, id?: string, callerId?: string): T {
        const instance_name = typeof instance === "string" ? instance : instance.name;


        this.logger.spam(`"${caller}" requests "${instance_name}"${id ? ' with id "' + id + '"' : ""}.`);

        // pseudo-inject new logger if needed
        if (instance_name == "Logger") {
            const logger = Logger.build()
                .className(caller)
                .id(callerId)
                .create();
            // this.options.logger.registerLogger(logger);
            return logger as any;
        }

        // handle actual instances
        const previously_created_instance = this.instances
            .find(inst => (inst.provides === instance_name)
                && (id ? inst.id === id : true)
            );

        if (previously_created_instance) {

            this.logger.spam(`Already have instance of "${instance_name}"${id ? ' for id "' + id + '"' : ""}.`);


            return previously_created_instance.instance;
        }

        this.logger.spam(`Looking for template of class "${instance_name}".`);


        const template_package = this.templates.find(templ => templ.provides == instance_name);

        if (!template_package) {
            throw new MissingDeclarationError(`No declaration for class "${instance_name}"`);
        }

        this.logger.spam(`Creating constructor argumentes for "${instance_name}".`);

        const constructorArguments: any[] = template_package.constructorArgs
            .map(className => this.gimme(className, instance_name, null, id));

        this.logger.info(`Creating new instance of "${instance_name}"${id ? ' with id "' + id + '"' : ""}.`);

        const new_instance = this.createInstance(template_package.template, constructorArguments);

        if (new_instance.__tna_di_inject_with_id__) {
            this.logger.spam(`Injecting instances with id for "${instance_name}"${id ? ' with id "' + id + '"' : ""}.`);

            for (let option of new_instance.__tna_di_inject_with_id__) {
                new_instance[option.paramKey] = this.gimme(option.type, instance_name, option.id, id);
            }
        }

        this.logger.spam(`Adding  "${instance_name}" ${id ? 'with id "' + id + '" ' : ""}to list of instances.`);

        this.instances.push({
            consumes: template_package
                .constructorArgs.map(name => ({
                    token: name,
                    id: null
                })),
            id: id,
            instance: new_instance,
            provides: instance_name,
            initState: "unset",
        });

        this.logger.spam(`Finished creating "${instance_name}"${id ? ' with id "' + id + '"' : ""}.`);

        return new_instance;
    }

    register(template: IApplication) {

        if (!template.__tna_di_decorated__) {
            throw new Error(`"${template}" is not injecable! Decorate with @Injectable() to fix this.`)
        }

        const templ_name = template.__tna_di_provides__;

        if (this.templates.findIndex(templ => templ_name == templ.provides) > -1) {
            this.logger.warn(`Skipping to register() "${templ_name}" since it's already known.`);
            return;
        }

        this.logger.spam(`Registering "${templ_name}" .`);

        const configs = template.__tna_di_configs__ || [];
        this.registerConfigs(configs);

        const declarations = template.__tna_di_declarations__ || [];

        if (declarations.length) {

            this.logger.spam(`Registering templates declared by "${templ_name}".`);

            for (const declaration of declarations) {
                this.register(declaration);
            }
        }

        this.templates.push({
            template: template,
            provides: templ_name,
            constructorArgs: template.__tna_di_consumes__,
            multiIds: []
        });
    }

    registerConfigs(configs: Configuration<any>[]) {
        for (let config of configs) {
            const previous_config = this.configurations
                .find(conf =>
                    conf.forModule == config.forModule
                    && conf.id == config.id
                );

            if (previous_config) {
                throw new UnspecificConfigError(`Configuration for "${config.forModule}"${config.id ? ' with id "' + config.id + '"' : ""} is already present`);
            }

            this.configurations.push(config);

        }
    }

    createInstance(target: any, args: any[]) {
        return new target(...args);
    }
}
