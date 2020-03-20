export class OptionNotProvidedError extends Error {
    constructor(option?: string) {
        super(option ? `Option ${option || ''} was not provided, but is required.` : undefined);
    }
}