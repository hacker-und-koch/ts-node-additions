export function Argument(key: string) {
    return function (target: any, propertyKey: string): void {
        // console.log(key, "<<<", target, ">>>>", propertyKey);

        if (!target.__tna_di_getopt_arguments__) {
            target.__tna_di_getopt_arguments__ = [];
        }

        target.__tna_di_getopt_arguments__.push({
            getOptKey: key,
            target: propertyKey
        });
    }
}
