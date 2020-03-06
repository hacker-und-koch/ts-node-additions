export function arrflat(array: any[]): any[] {
    return array.reduce((acc, cur) => [
        ...acc,
        ...(Array.isArray(cur) ?
            arrflat(cur) :
            [cur]
        )
    ], []);
}
