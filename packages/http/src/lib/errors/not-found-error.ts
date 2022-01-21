import { HttpError } from './http-error';

export class NotFoundError extends HttpError {
    constructor(message = 'Not Found') {
        super(message);
    }
    statusCode = 404;
}