import { GetOpt, GetOptOption, GetOptConfiguration } from '@hacker-und-koch/getopt';
import { ConfigurationProvider, Configuration } from './configurations';
import { OnConfigure, OnInit, OnReady, OnDestroy } from './hooks';
import { BootstrapPhaseError, MissingDeclarationError, MissingConfigurationError, UnspecificConfigError } from '../errors';
import { IInjectable, IApplication } from './hooks/injectable';
import { Logger, Loglevel } from '@hacker-und-koch/logger';

export interface ProviderOptions {
    loglevels?: { [classIdentifier: string]: Loglevel };
    configurations?: Configuration<any>[];
}

export interface TemplatePackage {
    template: any;
    provides: string;
    constructorArgs: string[];
    multiIds: { token: string, id: string }[];
    declaredBy: string;
}

export declare type HookState =
    'unset'
    | 'configuring'
    | 'configured'
    | 'initializing'
    | 'initialized'
    | 'ready'
    | 'destroying'
    | 'destroyed';

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
    private logger: Logger;

    constructor(private options?: ProviderOptions) {
        this.options = {
            ...{
                options: [],
                configurations: [],
            } as ProviderOptions,
            ...options,
            ...{
                loglevels: Providers.formatLogLevels(options.loglevels),
            }
        };

        const ownLogClassName = 'Providers';
        const ownLogLevel = this.logLevelOf(ownLogClassName);

        this.logger = Logger.build()
            .className(ownLogClassName)
            .level(ownLogLevel)
            .create();

        this.instances.push({
            consumes: [],
            id: null,
            initState: 'unset',
            instance: this,
            provides: 'Providers'
        });
    }

    createGetOpt(options: GetOptConfiguration) {
        let getopt = new GetOpt(options);
        this.getopt = getopt;

        this.instances.push({
            consumes: [],
            id: null,
            initState: 'unset',
            instance: getopt,
            provides: 'GetOpt'
        });
    }

    async setupShutdownHook() {
        let shutting_down = false;

        // keeps terminal session active
        if ('resume' in process.stdin) {
            process.stdin.resume();
        }

        process.once('SIGTERM', () => {
            this.logger.info('SIGTERM');
            callShutdown();
        });
        // process.removeAllListeners('SIGINT');
        process.once('SIGINT', () => {
            this.logger.info('SIGINT');
            callShutdown();
        });

        // catches "kill pid" (for example: nodemon restart)
        process.on('SIGUSR1', () => {
            this.logger.info('SIGUSR1');
            callShutdown();
        });
        process.on('SIGUSR2', () => {
            this.logger.info('SIGUSR2');
            callShutdown();
        });

        //catches uncaught exceptions
        process.on('uncaughtException', (err) => {
            this.logger.error(err);
            this.logger.warn('Shutting down because of error.')
            callShutdown(1);
        });
        const self = this;

        function callShutdown(code = 0) {

            if (shutting_down) {
                self.logger.warn(`Ignoring shutdown call! Already shutting down`);
                return;
            }

            shutting_down = true;

            self.destroyInstances()
                .then(errors => {
                    if (errors.length < 1) {
                        self.logger.info(`Exiting gracefully`);
                    } else {
                        self.logger.info(`Exiting with errors`);
                    }
                    process.exit(code);
                });
        }
    }

    async configureInstances() {
        this.logger.info(`Configuring ${this.instances.length} instances`);

        // set all getopt options before collecting configs
        for (const instance of this.instances as InstancePackage<OnConfigure>[]) {
            if (instance.instance.__tna_di_getopt_options__) {
                for (let option of instance.instance.__tna_di_getopt_options__) {

                    let value: unknown = undefined;
                    if (option.getOptKey in this.getopt.options) {
                        value = this.getopt.options[option.getOptKey];
                    } else if ('defaultVal' in option) {
                        value = option.defaultVal;
                    }

                    this.logger.spam(`Setting key '${option.target}' on ${instance.provides} to ${value} from getopt option '${option.getOptKey}'`);
                    (instance.instance as any)[option.target] = value;
                }
            }
            if (instance.instance.__tna_di_getopt_arguments__) {
                for (let option of instance.instance.__tna_di_getopt_arguments__) {
                    this.logger.spam(`setting key '${option.target}' on ${instance.provides} from getopt argument '${option.getOptKey}'`);
                    let keySplit = option.getOptKey.split('.');
                    let value = this.getopt.posTree[keySplit.shift()];

                    for (let arg of keySplit) {
                        if (typeof value !== 'undefined' && typeof value[arg] !== 'undefined') {
                            value = value[arg];
                        } else if (typeof option.defaultVal !== 'undefined') {
                            value = Array.isArray(option.defaultVal) ? [...option.defaultVal] : option.defaultVal;
                            break;
                        }
                    }
                    (instance.instance as any)[option.target] = value;
                }
            }
            if (instance.instance.__tna_di_getopt_commandStates__) {
                for (let option of instance.instance.__tna_di_getopt_commandStates__) {
                    this.logger.spam(`setting key '${option.target}' on ${instance.provides} from getopt command state '${option.getOptKey}'`);
                    let keySplit = option.getOptKey.split('.');
                    let value = this.getopt.posTree[keySplit.shift()];

                    for (let arg of keySplit) {
                        if (typeof value !== 'undefined' && typeof value[arg] !== 'undefined') {
                            value = value[arg];
                        } else {
                            value = false;
                            break;
                        }
                    }
                    (instance.instance as any)[option.target] = typeof value !== 'undefined';
                }
            }
        }

        // reverse instances to configure from 'outside' to 'inside'
        const reversed_instances = [...this.instances].reverse();

        await this.applyConfigurations(reversed_instances);

        this.logger.info(`Done configuring`);
    }

    private async applyConfigurations(instances: InstancePackage<OnConfigure & ConfigurationProvider & IInjectable>[]): Promise<void> {

        for (const instance of instances) {
            await this.applyConfiguration(instance);
        }

    }

    private async applyConfiguration(instance: InstancePackage<OnConfigure & ConfigurationProvider & IInjectable>): Promise<void> {
        if (instance.initState !== 'unset') {
            throw new BootstrapPhaseError(`Trying to configure ${instance.provides}${instance.id ? '[' + instance.id : ']'} which has already been touched`);
        }


        const matching_conf = this.options.configurations
            .find(conf =>
                conf.forModule === instance.provides
                && conf.id === instance.id
            );
        const conf_key_package = instance.instance.__tna_di_configuration_key__;

        if (conf_key_package && !matching_conf && !conf_key_package.defaultConfiguration) {

            const err_text = `${instance.provides}` +
                (instance.id ? '[' + instance.id + ']' : '') +
                ' requires configuration, but none is present!';

            throw new MissingConfigurationError(err_text);

        }

        instance.initState = 'configuring';

        if (conf_key_package) {
            (instance.instance as any)[conf_key_package.propertyKey] = {
                ...conf_key_package.defaultConfiguration,
                ...(instance.instance as any)[conf_key_package.propertyKey],
                ...(matching_conf && matching_conf.config || {})
            };
        }

        if (typeof instance.instance.onConfigure == 'function') {
            this.logger.spam(`Starting to configure ${instance.provides}${instance.id ? '[' + instance.id + ']' : ''}`);

            await instance.instance.onConfigure.apply(instance.instance);

            this.logger.spam(`${instance.provides}${instance.id ? '[' + instance.id + ']' : ''} is configured`);
        }

        instance.initState = 'configured';

        if (typeof (instance.instance as ConfigurationProvider).onProvideConfigurations == 'function') {
            const configs = await instance.instance.onProvideConfigurations.apply(instance.instance);

            const maps = instance.instance.__tna_di_config_id_map__;
            if (maps) {
                for (let conf of configs) {
                    if (Object.keys(maps).indexOf(conf.id) > -1) {
                        conf.id = maps[conf.id];
                    }
                }
            }

            this.options.configurations = [
                ...this.options.configurations,
                ...configs
            ];
        }
        return;
    }

    async initInstances() {

        this.logger.info(`Initializing ${this.instances.length} instances`);

        for (let instance of this.instances as InstancePackage<OnInit>[]) {
            if (instance.initState !== 'configured') {
                if (instance.initState == 'unset') {
                    await this.applyConfiguration(instance as any);
                } else {
                    throw new BootstrapPhaseError(`Trying to init ${instance.provides}${instance.id ? '[' + instance.id : ']'} although it has already been initialized`);
                }
            }

            instance.initState = 'initializing';

            if (typeof instance.instance.onInit == 'function') {

                this.logger.spam(`Starting to initialize ${instance.provides}${instance.id ? '[' + instance.id + ']' : ''}`);
                await instance.instance.onInit.apply(instance.instance);

                this.logger.spam(`${instance.provides}${instance.id ? '[' + instance.id + ']' : ''} is initialized`);

            }
            instance.initState = 'initialized';
        }

        this.logger.info(`Initialization complete`);
    }

    announceReady() {
        this.logger.info(`Announcing ready state to ${this.instances.length} instances`);

        for (let instance of this.instances as InstancePackage<OnReady>[]) {
            if (instance.initState !== 'initialized') {
                throw new BootstrapPhaseError(`Trying to announce ready state to ${instance.provides}${instance.id ? '[' + instance.id + ']' : ''} although it is not initialized yet`);
            }

            if (typeof instance.instance.onReady == 'function') {
                instance.instance.onReady();
            }
            instance.initState = 'ready';
        }
    }

    async destroyInstances() {
        this.logger.info(`Destroying ${this.instances.length} instances`);
        let destructionErrors: Error[] = [];
        for (let instance of this.instances as InstancePackage<OnDestroy>[]) {

            if (instance.initState === 'destroyed') {
                throw new BootstrapPhaseError(`Trying to destroy ${instance.provides}${instance.id ? '[' + instance.id : ']'} although it is already destroyed`);
            }

            if (instance.initState === 'destroying') {
                throw new BootstrapPhaseError(`Trying to destroy ${instance.provides}${instance.id ? '[' + instance.id : ']'} although it is already beeing destroyed`);
            }

            instance.initState = 'destroying';
            if (typeof instance.instance.onDestroy == 'function') {
                this.logger.spam(`Calling onDestroy on ${instance.provides}`);
                try {
                    await instance.instance.onDestroy();
                } catch (e) {
                    this.logger.error(`Failed to destroy ${instance.provides}`, e);
                    destructionErrors.push(e);
                }
                this.logger.spam(`${instance.provides} destroyed`);
            }

            instance.initState = 'destroyed';
        }
        this.logger.info('All instances destroyed');
        return destructionErrors;
    }



    gimme(instance: string, caller: string): any
    gimme(instance: any, caller: string): any
    gimme(instance: string | any, caller: string, id: string): any
    gimme<T>(instance: string | any, caller: string): T
    gimme<T>(instance: string | any, caller: string, id: string): T
    gimme<T>(instance: string | any, caller: string, id: string, callerId: string): T
    gimme<T>(instance: string | any, caller: string, id?: string, callerId?: string): T {
        const instance_name = typeof instance === 'string' ? instance : instance.name;

        this.logger.spam(`${caller} requires ${instance_name}${id ? '[' + id + ']' : ''}`);

        // pseudo-inject new logger if needed
        if (instance_name == 'Logger') {
            const logger = Logger.build()
                .className(caller)
                .id(callerId)
                .level(this.logLevelOf(caller))
                .create();

            return logger as any;
        }

        // handle actual instances
        const previously_created_instance = this.instances
            .find(inst => (inst.provides === instance_name)
                && (inst.id === id)
            );

        if (previously_created_instance) {

            this.logger.spam(`Already have instance of ${instance_name}${id ? '[' + id + ']' : ''}`);


            return previously_created_instance.instance;
        }

        this.logger.spam(`Looking for declaration of ${instance_name}`);


        const template_package = this.templates.find(templ => templ.provides == instance_name);

        if (!template_package) {
            this.logger.warn(`${instance_name} is not found in:`, this.templates.map(templ => templ.provides));
            throw new MissingDeclarationError(`No declaration for class ${instance_name}`);
        }

        this.logger.spam(`Creating constructor argumentes of ${instance_name}`);

        const constructorArguments: any[] = template_package.constructorArgs
            .map(className => this.gimme(className, instance_name, null, id));

        this.logger.info(`Creating new instance of ${instance_name}${id ? '[' + id + ']' : ''}`);

        const new_instance = this.createInstance(template_package.template, constructorArguments);

        if (new_instance.__tna_di_inject_with_id__) {
            this.logger.spam(`Injecting instances with id for ${instance_name}${id ? '[' + id + ']' : ''}`);

            for (let option of new_instance.__tna_di_inject_with_id__) {
                new_instance[option.paramKey] = this.gimme(option.type, instance_name, option.id, id);
            }
        }

        this.logger.spam(`Adding ${instance_name}${id ? '[' + id + ']' : ''} to list of instances`);

        this.instances.push({
            consumes: template_package
                .constructorArgs.map(name => ({
                    token: name,
                    id: null
                })),
            id: id,
            instance: new_instance,
            provides: instance_name,
            initState: 'unset',
        });

        new_instance['__tna_di_id'] = id;
        new_instance['__tna_di_name'] = instance_name;

        this.logger.spam(`Finished creating ${instance_name}${id ? '[' + id + ']' : ''}`);

        return new_instance;
    }

    register(template: IApplication, caller: string) {
        if (!template.__tna_di_decorated__) {
            throw new Error(`'${template}' is not injecable! Decorate with @Injectable() to fix this.`)
        }
        
        const templ_name = template.__tna_di_provides__;
        const prev_idx = this.templates.findIndex(templ => templ_name == templ.provides)
        if (prev_idx > -1) {
            this.logger.info(`Removing current declaration of ${this.templates[prev_idx].provides} because of update by ${caller}`);
            this.templates.splice(prev_idx, 1);
        }
        const configs = template.__tna_di_configs__ || [];
        
        this.registerConfigs(configs);
        
        this.logger.spam(`Registering ${templ_name} as declared by ${caller}`);
        this.templates.push({
            template: template,
            provides: templ_name,
            constructorArgs: template.__tna_di_consumes__,
            multiIds: [],
            declaredBy: caller
        });
        
        const declarations = template.__tna_di_declarations__ || [];
        if (declarations.length) {
            this.logger.spam(`Evaluating declarations of ${templ_name}`);

            for (const declaration of declarations) {
                this.register(declaration, templ_name);
            }
        }
    }

    registerConfigs(configs: Configuration<any>[]) {
        for (let config of configs) {
            const previous_config = this.options.configurations
                .find(conf =>
                    conf.forModule == config.forModule
                    && conf.id == config.id
                );

            if (previous_config) {
                throw new UnspecificConfigError(`Configuration for ${config.forModule}${config.id ? '[' + config.id + ']' : ''} is already present`);
            }

            this.options.configurations.push(config);
        }
    }

    createInstance(target: any, args: any[]) {
        return new target(...args);
    }

    static formatLogLevels(input: Loglevel | { [className: string]: Loglevel }): { [classIdentifier: string]: Loglevel } {
        if (typeof input === 'string') {
            return {
                '*': input,
            };
        }
        const output = {
            '*': 'spam',
            ...input,
        } as { [classIdentifier: string]: Loglevel };

        return output;
    }

    static logLevelIn(identifier: string, levels: { [identifier: string]: Loglevel }): Loglevel {
        if (identifier in levels) {
            return levels[identifier];
        } else {
            return levels['*'];
        }

    }

    private logLevelOf(classIdentifier: string): Loglevel {
        return Providers.logLevelIn(classIdentifier, this.options.loglevels);
    }
}
