import { Injectable, Inject, Providers, OnConfigure } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';
import { MethodNotAllowedError } from './errors';
import { RouteDecorated } from './decorators';
import { Default404Route } from './default-404.route';
import { RouteOptions } from './models';
import { RequestContext } from './request-context';
import { pathHasVariables, evaluatePathVariables } from './util';


@Injectable()
export class RequestHandler implements OnConfigure {

    path: string;

    protected handlers: RequestHandler[] = [];

    @Inject(Default404Route)
    protected defaultHandler: {
        handle: (ctx: RequestContext) => Promise<any>;
    };

    constructor(protected logger: Logger) {

    }

    handle(ctx: RequestContext): Promise<any> {
        this.logger.info('Letting 404 handler take over.');

        return this.defaultHandler.handle.apply(this.defaultHandler, [ctx]);
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

    onGet?: () => any;
    onPut?: () => any;
    onPost?: () => any;
    onDelete?: () => any;
    onMethod?: (method: string) => any;

    private isPathRelevant(ctx: RequestContext, handler: RequestHandler): boolean {
        const requestedPath = ctx.pathToEvaluate;
        const handledPath = handler.handledPath;
        this.logger.spam(`Requested: '${requestedPath}', Handler: '${handledPath}'`);
        if (pathHasVariables(handledPath)) {
            const evaluation = evaluatePathVariables(handledPath, requestedPath);
            this.logger.spam('Evaluated path:', evaluation);
            if (evaluation.pathMatchesTemplate) {
                ctx.announcePathVariables(evaluation.variables);
                return true;
            } else {
                return false;
            }
        }
        return requestedPath.indexOf(handledPath) === 0;
    }
    private isHandlerRelevant(ctx: RequestContext, handler: RequestHandler) {
        return this.isPathRelevant(ctx, handler);
    }

    protected async handleRequest(ctx: RequestContext): Promise<any> {
        this.logger.info(`Handling request ${ctx.id}`);
        ctx.announcePathSegmentAsEvaluated(this.handledPath);

        this.logger.spam('Checking children:', this.handlers.map(h => h.logger.className));
        for (let handler of this.handlers) {
            this.logger.spam('Checking', handler.logger.className);
            if (this.isHandlerRelevant(ctx, handler)) {
                this.logger.spam(`Assigning ${ctx.id} to ${handler.logger.className}`);
                return handler.handleRequest.apply(handler, [ctx]);
            }
        }

        this.logger.spam('No child handler is taking care. gotta do it on my own.');
        if (this.methods.indexOf(ctx.method) < 0) {
            throw new MethodNotAllowedError();
        }
        return this.handle.apply(this, [ctx]);
    }

    // "hidden" DI hook for internal use
    private _tnaOnInstancesCreated(instanceConfig?: any, providers?: Providers) {
        const handlers = [...(this.reflectedOptions?.handlers || instanceConfig?.handlers || [])];
        this.logger.spam(`Will create ${handlers.length} handler instances via DI`);

        for (let handler of handlers) {
            const instance = providers.gimme<RequestHandler>(handler, this.logger.className);
            this.logger.spam(`Adding ${instance.logger.className} to ${this.logger.className}`);
            this.use(instance);
        }
    }

    protected get handledPath() {
        return this.reflectedOptions?.path || '';
    }

    protected get reflectedOptions(): RouteOptions {
        return ((this as any).__proto__.constructor as RouteDecorated)?.__tna_http_route_options__;
    }

    protected get methods(): string[] {
        const reflected = this.reflectedOptions?.methods;
        if (reflected === undefined) {
            this.logger.warn('No methods set. Defaulting to ["GET"]');
        }
        return reflected || ['GET'];
    }


    onConfigure() {

    }
}
