export class UnknownOptionError extends Error {
    constructor(option?: string) {
        super(`Option ${option || ''} was provided, but is not configured.`);
    }
}

export class UnknownShortOptionError extends Error {
    constructor(shortOption: string, argChunk: string) {
        super(`Short option -${shortOption || ''} was provided in arg ${argChunk}, but is unknown.`);
    }
}
