
export function pkgNameToClassName(pkgName: string) {
    return pkgName.split("-").reduce((a, c) => {
        c = c.charAt(0).toUpperCase() + c.substr(1);
        return a + c;
    }, "");
}


export function classNameToVariableName(className: string) {
    return className[0].toLowerCase() + className.substr(1);
}
