
export function InjectConfiguration(): (target: any, propertyKey: any) => void;
export function InjectConfiguration(defaultConfiguration: any): (target: any, propertyKey: any) => void;
export function InjectConfiguration<T>(defaultConfiguration?: T): (target: any, propertyKey: any) => void;
export function InjectConfiguration<T>(defaultConfiguration?: T): (target: any, propertyKey: any) => void {
    return function (target: T, propertyKey: string): void {
        // console.log(key, "<<<", target, ">>>>", propertyKey);

        if ((target as any).__tna_di_configuration_key__) {
            throw new Error("Cannot have two configurations.");
        }

        (target as any).__tna_di_configuration_key__ = {
            propertyKey: propertyKey,
            defaultConfiguration: defaultConfiguration || {}
        };
    }
}
