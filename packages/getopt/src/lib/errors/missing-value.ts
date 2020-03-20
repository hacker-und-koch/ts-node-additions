export class MissingValueError extends Error {
    constructor(option?: string, type?: string) {
        super(option ? `Value missing for option '${option}'. Configured type: '${type}'.` : undefined);
    }
}
