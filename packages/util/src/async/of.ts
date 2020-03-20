export async function of<T>(some: T): Promise<T> {
    return new Promise<T>(resolve => {
        resolve(some);
    });
}