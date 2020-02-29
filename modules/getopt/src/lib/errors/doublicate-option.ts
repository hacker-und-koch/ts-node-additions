export class DoublicateOptionError extends Error {
    constructor(option: string, oldval: string, curval: string) {
        super(`Value '${curval}' provided for option '${option}' that already has value '${oldval}' assigned.`);
    }
}
