import { Providers, LoglevelOption } from "./providers";
import { IApplication } from "./hooks/injectable";
import { Injectable } from "../decorators";

export interface StepTesterOptions {
    configurations?: any[];
    declarations?: any[];
    options?: { [long_opt: string]: string };
    loglevel?: LoglevelOption;
}
export class StepTester<T> {
    instance: T;
    providers: Providers;

    private notCalled = ["configure", "init", "ready", "destroy"];

    constructor(target: T, options?: StepTesterOptions) {
        options = Object.assign({
            configurations: [],
            declarations: [],
            options: options && options.options || {},
            log: false
        } as StepTesterOptions, options || {});

        this.providers = new Providers({
            configurations: options.configurations,
            loglevels: options.loglevel,
        });

        this.providers.register(target, 'StepTester');

        if (options.declarations.length) {
            for (let declaration of options.declarations) {
                this.providers.register(declaration, 'StepTester');
            }
        }

        this.instance = this.providers.gimme((target as IApplication).__tna_di_provides__, "teststrap()");
    }

    async configure(): Promise<T> {
        const index = this.notCalled.indexOf("configure");
        if (index > -1) {
            this.notCalled.splice(index, 1);
            await this.providers.configureInstances();
        }
        return this.instance;
    }

    async init(): Promise<T> {
        const index = this.notCalled.indexOf("init");
        if (index > -1) {
            this.notCalled.splice(index, 1);
            await this.providers.initInstances();
        }
        return this.instance;
    }

    ready(): T {
        const index = this.notCalled.indexOf("ready");
        if (index > -1) {
            this.notCalled.splice(index, 1);
            this.providers.announceReady();
        }
        return this.instance;
    }

    async destroy(): Promise<T> {
        const index = this.notCalled.indexOf("destroy");
        if (index > -1) {
            this.notCalled.splice(index, 1);
            await this.providers.destroyInstances();
        }
        return this.instance;
    }

    async getReady(): Promise<T> {
        await this.configure();
        await this.init();
        this.ready();
        return this.instance;
    }

    static new<T>(): StepTesterBuilder<T> {
        return new StepTesterBuilder<T>();
    }

    static withTarget<U>(target: U): StepTesterBuilder<any> {
        return StepTester.new<any>()
            .target(target);
    }
}
export declare type RunphaseTarget = "not-at-all" | "configure" | "init" | "ready" | "destroy";
export class StepTesterBuilder<T> {

    private _target: any = DefaultClass;
    private _runUntil: RunphaseTarget = "not-at-all";
    private _testerOptions: StepTesterOptions = {};

    target(target: any): this {
        this._target = target;
        return this;
    }

    runIntil(phase: RunphaseTarget): this {
        this._runUntil = phase;
        return this;
    }

    options(options: StepTesterOptions): this {
        this._testerOptions = options;
        return this;
    }

    async build(): Promise<StepTester<T>> {
        const tester = new StepTester(this._target, this._testerOptions);

        if (/^(configure|init|ready|destroy)$/.test(this._runUntil)) {
            await tester.configure();
        }
        if (/^(init|ready|destroy)$/.test(this._runUntil)) {
            await tester.init();
        }
        if (/^(ready|destroy)$/.test(this._runUntil)) {
            tester.ready();
        }
        if (this._runUntil == "destroy") {
            await tester.destroy();
        }
        return tester;
    }
}

@Injectable()
export class DefaultClass {

}