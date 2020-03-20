export class MissingCommandError extends Error {
    constructor(message?: string) {
        super(message || `Command expected.`);
    }
}
