import { Injectable, Inject, Providers, OnConfigure } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';
import { MethodNotAllowedError, NotFoundError } from './errors';
import { RouteDecorated } from './decorators';
import { Default404Route } from './default-404.route';
import { RouteOptions } from './models';
import { RequestContext } from './request-context';
import { pathHasVariables, evaluatePathVariables } from './util';

export interface PathsOAS {
    [path: string]: {
        [method: string]: any;
    }
}

@Injectable()
export class RequestHandler implements OnConfigure {

    @Inject(Default404Route)
    protected defaultHandler: {
        handle: (ctx: RequestContext) => Promise<any>;
    };

    protected handlers: RequestHandler[] = [];

    constructor(protected logger: Logger) { }

    private handle(ctx: RequestContext): Promise<any> {
        if (Object.keys(this.methodHandlers).length < 1) {
            this.logger.info('Letting 404 handler take over.');
            return this.defaultHandler.handle.apply(this.defaultHandler, [ctx]);
        }

        if (['GET', 'PUT', 'POST', 'DELETE'].indexOf(ctx.method) > -1) {
            const methodKey = this.methodHandlers[ctx.method];
            if (methodKey && methodKey in this) {
                return (this as any)[methodKey].apply(this, [ctx]);
            }
        } else if (this.methodHandlers.ANY) {
            return (this as any)[this.methodHandlers.ANY].apply(this, [ctx]);
        }

        throw new MethodNotAllowedError();
    }

    use(handler: RequestHandler): void;
    use(handler: RequestHandler) {
        this.handlers.push(handler);
    }

    unuse(handler: RequestHandler): void;
    unuse(handler: RequestHandler) {
        const idx = this.handlers.indexOf(handler);
        if (idx < 0) {
            this.logger.error(`Trying to remove handler for path ${handler.handledPath}, but it's not used.`);
        } else {
            this.handlers.splice(idx, 1);
        }
    }

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
        if (this.reflectedOptions?.setHeaders) {
            for (let key in this.reflectedOptions?.setHeaders) {
                ctx.setHeader(key, this.reflectedOptions?.setHeaders[key]);
            }
        }
        this.logger.spam('Checking children:', this.handlers.map(h => h.logger.className));
        for (let handler of this.handlers) {
            this.logger.spam('Checking', handler.logger.className);
            if (this.isHandlerRelevant(ctx, handler)) {
                this.logger.spam(`Assigning ${ctx.id} to ${handler.logger.className}`);
                return handler.handleRequest.apply(handler, [ctx]);
            }
        }

        this.logger.spam('No child handler is taking care. gotta do it on my own.');
        if (ctx.pathToEvaluate.length > 0 && this.reflectedOptions?.matchExact) {
            throw new NotFoundError();
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

    protected get methodHandlers(): { [method: string]: string } {
        return (this as any).constructor.prototype.__tna_http_method_handlers__ || {};
    }

    protected get methods(): string[] {
        return Object.keys({
            ...this.methodHandlers,
            ...this.handlers.reduce((acc, cur) => ({
                ...acc,
                ...cur.methods.reduce((acc, cur) => ({
                    ...acc,
                    [cur]: true,
                }), {})
            }), {}),
        });
    }

    onConfigure() {

    }

    get allHandlers(): PathCollection {
        return {
            methods: Object.keys(this.methodHandlers),
            paths: this.handlers.reduce((acc, handler) => {
                return {
                    ...acc,
                    [handler.handledPath]: handler.allHandlers,
                }
            }, {})
        }
    }

    get pathsOAS(): PathsOAS {
        return collectionToOAS(this.allHandlers);
    }
}

interface PathCollection {
    methods: string[];
    paths: { [key: string]: PathCollection };
}

function collectionToOAS(collection: PathCollection, prefix: string = '') {
    let out: any = {};
    for (let path in collection.paths) {
        const actualPath = `${prefix}${path}`;
        const methods = collection.paths[path].methods;
        if (methods && methods.length) {
            out[actualPath] = {};
            for (let method of methods) {
                out[actualPath][method] = { description: 'exists' };
            }
        }
        out = {
            ...out,
            ...collectionToOAS(collection.paths[path], actualPath),
        }
    }

    return out;
}
