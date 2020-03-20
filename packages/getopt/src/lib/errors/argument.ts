export class ArgumentError extends Error {
    constructor(message?: string) {
        super(message || `Error in GetOpt argument parsing.`);
    }
}
