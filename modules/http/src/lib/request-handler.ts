import { Injectable, Inject } from '@tna/di';
import { Logger } from '@tna/logger';
import { Default404Route } from './default-404.route';
import { Response, Request } from './models';


@Injectable()
export class RequestHandler<T, U> {

    path: string;

    protected handlers: RequestHandler<unknown, unknown>[] = [];

    @Inject(Default404Route)
    protected defaultHandler: { handle: (req: Request<unknown>, res: Response) => Promise<unknown> }

    constructor(protected logger: Logger) {

    }

    handle(request: Request<T>, response: Response): Promise<U> {
        throw new Error('No overwrite for handle function of RequestHandler.');
    }

    use(handler: RequestHandler<unknown, unknown>): void;
    use<T, U>(handler: RequestHandler<T, U>) {
        this.handlers.push(handler);
    }

    unuse(handler: RequestHandler<unknown, unknown>): void;
    unuse<T, U>(handler: RequestHandler<T, U>) {
        const idx = this.handlers.indexOf(handler);
        if (idx < 0) {
            this.logger.error(`Trying to remove handler for path ${handler.path}, but it's not used.`);
        } else {
            this.handlers.splice(idx, 1);
        }
    }



    private isHandlerRelevant(request: Request<unknown>, handler: RequestHandler<unknown, unknown>) {
        return request.parsedUrl.path === handler.path;
    }

    protected async handleRequest(request: Request<unknown>, response: Response): Promise<unknown> {
        if (this.isHandlerRelevant(request, this)) {
            this.logger.info(`Handling request ${request.id}`);
            return this.handle(request as Request<any>, response);
        }

        let relevantHandler: RequestHandler<unknown, unknown> = this.handlers
            .find(handler => this.isHandlerRelevant(request, handler));

        if (!relevantHandler) {
            this.logger.info('Letting 404 handler take over');

            return this.defaultHandler.handle(request as Request<void>, response);
        }

        return relevantHandler.handleRequest(request, response);
    }
}
