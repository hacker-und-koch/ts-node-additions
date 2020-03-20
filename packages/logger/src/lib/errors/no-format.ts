export class NoFormatFunctionError extends Error {
    constructor(message?: string) {
        super(message || "Logger has no 'format' function set.");
    }
}