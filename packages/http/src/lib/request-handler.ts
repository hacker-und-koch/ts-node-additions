import { Injectable, Inject, Providers, OnConfigure } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';
import { RouteDecorated } from './decorators';
import { Default404Route } from './default-404.route';
import { Response, Request } from './models';
import { evaluatePathname } from './util';


@Injectable()
export class RequestHandler implements OnConfigure {

    path: string;

    protected handlers: RequestHandler[] = [];

    @Inject(Default404Route)
    protected defaultHandler: { handle: (req: Request, res: Response) => Promise<any> }

    constructor(protected logger: Logger) {
        
    }

    handle(request?: Request, response?: Response): Promise<any> {
        this.logger.info('Letting 404 handler take over');

        return this.defaultHandler.handle(request, response);
    }

    use(handler: RequestHandler): void;
    use(handler: RequestHandler) {
        this.handlers.push(handler);
    }

    unuse(handler: RequestHandler): void;
    unuse(handler: RequestHandler) {
        const idx = this.handlers.indexOf(handler);
        if (idx < 0) {
            this.logger.error(`Trying to remove handler for path ${handler.path}, but it's not used.`);
        } else {
            this.handlers.splice(idx, 1);
        }
    }



    private isHandlerRelevant(request: Request, handler: RequestHandler): boolean {
        const requestedPath = request.parsedUrl.pathname;
        const handledPath = ((handler as any).__proto__.constructor as  RouteDecorated)?.__tna_http_route_options__.path;
        this.logger.log(`'${requestedPath}' <<-->> '${handledPath}'`, requestedPath === handledPath);
        return requestedPath === handledPath;
    }

    protected async handleRequest(request: Request, response: Response): Promise<any> {
        const evaluatedRequestUrl = evaluatePathname(request.parsedUrl.pathname, this.path);

        if (evaluatedRequestUrl.isMatch) {
            this.logger.info(`Handling request ${request.id}`);
            return this.handle(request, response);
        }

        const relevantHandler: RequestHandler = this.handlers
            .find(handler => this.isHandlerRelevant(request, handler));

        if (!relevantHandler) {
            return this.handle(request, response);
        }

        return relevantHandler.handleRequest(request, response);
    }

    onConfigure() {
        
    }
}
