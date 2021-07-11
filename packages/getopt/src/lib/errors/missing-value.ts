export class MissingValueError extends Error {
    constructor(option?: string, type?: string) {
        super(option ? `Value missing for option '${option}'. Configured type: '${type}'.` : undefined);
    }
}

export class MissingValueInShortArgs extends Error {
    constructor(shortOption:string, chunk: string) {
        super(`Short optioon ${shortOption} should be followed by a value. Instead ${chunk} was provided.`);
    }
}
