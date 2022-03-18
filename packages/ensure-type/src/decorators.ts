import "reflect-metadata";

export const INTERNAL_TYPE_KEY = Symbol('__et_type_info__');
export const INTERNAL_NAME_KEY = Symbol('__et_name__');

export function DataType(): any {
    return function (
        target: any,
    ): any {
        target[INTERNAL_NAME_KEY] = target.name;
    }
}

export function Optional(): any {
    return function (
        target: any,
        propertyKey: string | symbol,
    ): any {
        const ownType = Reflect.getMetadata("design:type", target, propertyKey);
      
        if (!target.constructor[INTERNAL_TYPE_KEY]) {
            target.constructor[INTERNAL_TYPE_KEY] = {};
        }
        target.constructor[INTERNAL_TYPE_KEY][propertyKey] = {
            type: ownType,
        }
    }
}


export function Mandatory(): any {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,

    ): any {
        Optional()(target, propertyKey, descriptor);
        target.constructor[INTERNAL_TYPE_KEY][propertyKey].mandatory = true;
    }
}
