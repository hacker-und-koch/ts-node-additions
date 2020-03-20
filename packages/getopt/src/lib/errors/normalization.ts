export class NormalizationFailedError extends Error {
    constructor(message?: string) {
        super(message || `Detected failure in argument normalization.`);
    }
}
