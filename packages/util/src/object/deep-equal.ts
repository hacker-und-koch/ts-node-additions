export function deepEqual(a: any, b: any) {
    const aType = typeof a;
    const bType = typeof b;

    if (aType !== bType) {
        return false;
    }

    if (aType !== 'object') {
        return a === b;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (bKeys.find(k => aKeys.indexOf(k) < 0)) {
        // b has key, that a does not
        return false;
    }

    for (let k of aKeys) {
        if (
            (typeof a[k] === 'object'
                && !deepEqual(a[k], b[k]))
            || (a[k] !== b[k])
        ) {
            return false;
        }
    }

    return true;
}
