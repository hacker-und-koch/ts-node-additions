import { HttpError } from './http-error';

export class RequestTimeoutError extends HttpError {

    constructor(message: string = 'Request timed out') {
        super(message);
    }

    statusCode = 408;
}