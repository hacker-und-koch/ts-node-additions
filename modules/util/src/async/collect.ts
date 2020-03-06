
export async function collect<T>(functions: (() => Promise<T>)[]): Promise<T[]> {
    const result = [];
    for (let i = 0; i < functions.length; ++i) {
        result.push(await functions[i]()); 
    }
    return result;
} 
