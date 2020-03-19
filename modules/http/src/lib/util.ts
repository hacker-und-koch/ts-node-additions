export function evaluatePathname(requestedPath: string, handlerPath: string) {
    
    return {
        isMatch: requestedPath === handlerPath,
        isFullMatch: false,
        parmeters: {},
        usedLength: 0,
    }
}
