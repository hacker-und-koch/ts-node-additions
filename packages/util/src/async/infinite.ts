export interface CompletablePromise extends Promise<void> {
    complete(): void;
}

export function infinite(): CompletablePromise {
    let resolve: any;
    let done = () => { resolve() };

    let timeout: NodeJS.Timer;;

    return Object.assign(
        new Promise(res => {
            resolve = res;
            tick();
        }), {
            complete() {
                clearTimeout(timeout);
                done();
            }
        }
    ) as any;

    function tick() {
        clearTimeout(timeout);
        timeout = setTimeout(tick, 60e3);
    }
}