export class UnknownOptionError extends Error {
    constructor(option?: string) {
        super(`Option ${option || ''} was provided, but is not configured.`);
    }
}