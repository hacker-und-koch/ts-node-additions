export async function map(p: Promise<any>, map: (x: any) => any) {
    return map(await p);
}
