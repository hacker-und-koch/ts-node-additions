import "reflect-metadata";

export const INTERNAL_TYPE_KEY = Symbol('__ts_type_info__');
export const INTERNAL_NAME_KEY = Symbol('__ts_name__');
export const INTERNAL_VALUE_DB = Symbol('__ts_value_db__');

export interface DataTypeDecorated {
    [INTERNAL_NAME_KEY]: string;
    // create(template: any): T & DataTypeDecorated {

    // };
}

export interface ValueOptions {
    default: any;
}

export function DataType() {
    return function <T /* extends new (...args: any[]) => T & DataTypeDecorated */>(
        target: T
    ): DataTypeDecorated & T {
        // (target as any).__proto__.constructor = (template: any) => {
        //     for (let key in template) {
        //         this[key] = template[key];
        //     }
        // }
        (target as any).__proto__.constructor = () => {
            return 'yoyo'
        }
        return Object.assign(target as T, {
            [INTERNAL_NAME_KEY]: (target as any).name,
            toString() { return 'yayo' }
            // CANNOT BE TYPED:
            // create: (template?: T) => {
            //     const instance: T = new (target as any)();
            //     if (template !== undefined) {
            //         for (let key in template) {
            //             if (!(key in (instance as any).__proto__.constructor[INTERNAL_TYPE_KEY])) {
            //                 throw new Error(`Type template contained unknown key '${key}'`);
            //             }


            //             instance [key] = template[key];
            //             console.log(instance);
            //         }

            //     }
            //     console.log('instance:', instance);
            //     return instance;
            // }
        }) as any;
    }
}

export function Optional(opts?: ValueOptions): any {
    return function (
        target: any,
        propertyKey: string | symbol,
    ): any {
        const ownType = Reflect.getMetadata("design:type", target, propertyKey);

        if (!target.constructor[INTERNAL_TYPE_KEY]) {
            target.constructor[INTERNAL_TYPE_KEY] = {};
        }

        if (!target[INTERNAL_VALUE_DB]) {
            Object.defineProperty(target, INTERNAL_VALUE_DB, {
                value: {},
                enumerable: false,
            });
        }

        Object.defineProperties((target as any), {
            [propertyKey]: {
                get: () => target[INTERNAL_VALUE_DB][propertyKey],
                set: (x: any) => {
                    if (!checkType(x, ownType)) {
                        throw new Error('Invalid assignment to DataType');
                    }
                    target[INTERNAL_VALUE_DB][propertyKey] = x;
                },
                configurable: false,
                enumerable: true,
            }
        });

        if (opts?.default !== undefined) {
            // may want to check typeof default..
            target[INTERNAL_VALUE_DB][propertyKey] = opts.default;
        }

        target.constructor[INTERNAL_TYPE_KEY][propertyKey] = {
            type: ownType,
        }

        return target;
    }
}

function checkType(value: any, template: any): boolean {
    const has = typeof value;
    const wants = template.name.toLowerCase();

    return has === wants;
}


export function Mandatory(opts?: ValueOptions): any {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,

    ): any {
        Optional(opts)(target, propertyKey, descriptor);
        target.constructor[INTERNAL_TYPE_KEY][propertyKey].mandatory = true;
        return target;
    }
}
