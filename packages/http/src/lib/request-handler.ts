import { Injectable, Inject, Providers, OnConfigure } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';
import { TypeStore } from '@hacker-und-koch/type-store';

import { MethodNotAllowedError, NotFoundError } from './errors';
import { MethodOptions, RouteDecorated } from './decorators';
import { Default404Route } from './default-404.route';
import { RouteOptions } from './models';
import { RequestContext } from './request-context';
import { pathHasVariables, evaluatePathVariables } from './util';
import { HTTP_METHOD_HANDLERS, HTTP_ROUTE_OPTIONS } from './symbols';

export interface PathsOAS {
    [path: string]: {
        [method: string]: any;
    }
}

@Injectable()
export class RequestHandler {

    @Inject(Default404Route)
    protected defaultHandler: {
        handle: (ctx: RequestContext) => Promise<any>;
    };

    protected handlers: RequestHandler[] = [];
    protected typeStore: TypeStore = new TypeStore();

    constructor(protected logger: Logger) { }

    private handle(ctx: RequestContext): Promise<any> {
        if (Object.keys(this.methodHandlers).length < 1) {
            this.logger.info('Letting 404 handler take over.');
            return this.defaultHandler.handle.apply(this.defaultHandler, [ctx]);
        }

        let methodKey = '';
        let opts: MethodOptions;
        if (['GET', 'PUT', 'POST', 'DELETE'].indexOf(ctx.method) > -1) {
            methodKey = this.methodHandlers[ctx.method]?.key;
            opts =  this.methodHandlers[ctx.method]?.options;

        } else if (this.methodHandlers.ANY) {
            methodKey = this.methodHandlers.ANY.key;
            opts =  this.methodHandlers.ANY?.options;
        }
        
        if (methodKey && methodKey in this) {
            ctx.setTypeStore(this.typeStore);
            if (opts.body) {
                ctx.restrictBody(opts.body);
            }
            if (opts.responses) {
                ctx.restrictResponses(opts.responses);
            }
            return (this as any)[methodKey].apply(this, [ctx]);
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

        for (let method in this.methodHandlers) {
            const opts = this.methodHandlers[method].options;
            if (opts) {
                if (opts.body) {
                    this.typeStore.add(opts.body);
                }
                if (opts.responses) {
                    for (let status in opts.responses) {
                        const type = opts.responses[status];
                        if (typeof type !== 'string') {
                            this.typeStore.add(type);
                        }
                    }
                }
            }
        }
    }

    protected get handledPath() {
        return this.reflectedOptions?.path || '';
    }

    protected get reflectedOptions(): RouteOptions {
        return (this as any).__proto__.constructor[HTTP_ROUTE_OPTIONS];
    }

    protected get methodHandlers(): { [method: string]: { key: string, options?: MethodOptions } } {
        return (this as any).constructor.prototype[HTTP_METHOD_HANDLERS] || {};
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

    get allHandlers(): PathCollection {
        return {
            methods: this.methodHandlers,
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

    get schemas(): { [key: string]: any } {
        return {
            // ...this.typeStore.schemas,
            ...this.handlers.reduce((acc, cur) => {

                return {
                    ...acc,
                    ...cur.schemas,
                };
            }, this.typeStore.schemas)
        };
    }
}

interface PathCollection {
    methods: { [method: string]: { key: string, options?: MethodOptions } };
    paths: { [key: string]: PathCollection };
}

function collectionToOAS(collection: PathCollection, prefix: string = '') {
    let out: any = {};
    for (let path in collection.paths) {
        const actualPath = `${prefix}${path}`;
        const methods = collection.paths[path].methods;
        if (methods && Object.keys(methods).length) {
            out[actualPath] = {};
            for (let method in methods) {
                const opts = methods[method].options;
                if (opts) {
                    const newEntry: any = out[actualPath][method] = {
                        description: opts.description,
                    };
                    if (opts.responses) {

                        const responses = newEntry.responses = {} as any;
                        for (let status in opts.responses) {
                            if (typeof opts.responses[status] === 'string') {
                                responses[String(status)] = {
                                    content: {
                                        [opts.responses[status]]: {
                                            schema: { type: 'string' }
                                        }
                                    }
                                }

                            } else {
                                responses[String(status)] = {
                                    content: {
                                        ['application/json']: {
                                            schema: {
                                                $ref: `#/components/schemas/${opts.responses[status].name}`,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (opts.body) {
                        const body = newEntry.requestBody = {} as any;
                        body.content = {
                            'application/json': {
                                schema: {
                                    $ref: `#/components/schemas/${(opts.body as any).name}`,
                                }
                            }
                        }
                    }
                } else {
                    out[actualPath][method] = { description: 'exists' };
                }
            }
        }
        out = {
            ...out,
            ...collectionToOAS(collection.paths[path], actualPath),
        }
    }

    return out;
}
