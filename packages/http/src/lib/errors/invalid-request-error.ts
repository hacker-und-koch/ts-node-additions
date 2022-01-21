import { HttpError } from './http-error';

export class InvalidRequestError extends HttpError {
    constructor(message = 'Request invalid') {
        super(message);
    }
    statusCode = 400;
}
