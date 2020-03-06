import "reflect-metadata";

export function getConstructorArgs(constructor: any) {
    return Reflect.getMetadata("design:paramtypes", constructor) || [];
}
