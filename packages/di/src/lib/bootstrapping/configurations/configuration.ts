import { IInjectable } from "../hooks/injectable";

export class Configuration<T> {
    constructor(
        public forModule: string,
        public config: T,
        public id: string
    ) {

    }
};

export function config<T>(forModule: any, configuration: T): Configuration<T>;
export function config<T>(forModule: any, configuration: T, id: string): Configuration<T>;
export function config<T>(forModule: any, configuration: T, id?: string): Configuration<T> {
    return new Configuration((forModule as IInjectable).__tna_di_provides__, configuration, id || null);
}
