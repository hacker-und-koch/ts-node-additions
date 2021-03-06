export function Option(key: string, defaultValue?: string | string[]) {
    return function (target: any, propertyKey: string): void {
        // console.log(key, "<<<", target, ">>>>", propertyKey);

        if (!target.__tna_di_getopt_options__) {
            target.__tna_di_getopt_options__ = [];
        }

        target.__tna_di_getopt_options__.push({
            getOptKey: key,
            target: propertyKey,
            defaultVal: defaultValue,
        });
    }
}
