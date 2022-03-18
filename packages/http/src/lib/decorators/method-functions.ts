import { HTTP_METHOD_HANDLERS } from '../symbols';

export interface MethodOptions {
    inBody?: any;
    outBody?: any;
    inType?: string;
    outType?: string;
}

function setMethodHandlers(target: any, key: string, method: string, options: MethodOptions) {
    target[HTTP_METHOD_HANDLERS] = {
        ...target[HTTP_METHOD_HANDLERS],
        [method]: { key, options },
    }
}

export function Get(options?: MethodOptions) {
    return function (target: any, propertyKey: string): void {
        setMethodHandlers(target, propertyKey, 'GET', options);
    }
}
export function Post(options?: MethodOptions) {
    return function (target: any, propertyKey: string): void {
        setMethodHandlers(target, propertyKey, 'POST', options);
    }
}
export function Put(options?: MethodOptions) {
    return function (target: any, propertyKey: string): void {
        setMethodHandlers(target, propertyKey, 'PUT', options);
    }
}
export function Delete(options?: MethodOptions) {
    return function (target: any, propertyKey: string): void {
        setMethodHandlers(target, propertyKey, 'DELETE', options);
    }
}
export function Handle(options?: MethodOptions) {
    return function (target: any, propertyKey: string): void {
        setMethodHandlers(target, propertyKey, 'ANY', options);
    }
}