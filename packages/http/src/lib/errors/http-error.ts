export class HttpError extends Error {
    statusCode: number = 500;
    constructor(message: string = "Internal Server Error") {
        super(message);
    }
}
