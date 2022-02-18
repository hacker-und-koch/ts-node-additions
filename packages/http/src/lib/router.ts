import { randomBytes } from 'crypto';
import { IncomingMessage, OutgoingMessage, ServerResponse } from 'http';

import { Injectable, InjectConfiguration, Inject, OnConfigure, OnInit, Providers, HookState, UnknownInstanceError } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';

import { HttpError, RequestTimeoutError } from './errors';
import { Server, ServerConfiguration } from './server';
import { RequestHandler } from './request-handler';
import { Default404Route } from './default-404.route';
import { RequestContext } from './request-context';
import { tnaHttpVersion } from './util';
import { RouteTree } from './route-tree';

export interface RouterConfiguration extends ServerConfiguration {
    maxRequestMs?: number;
    handlers?: (typeof RequestHandler)[]
}

export interface PathsOAS {
    [path: string]: {
        [method: string]: any;
    }
}

interface PathsOASAccumulator {
    out: PathsOAS,
    currentSegment: string[];
    currentObject: any;
}

@Injectable({
    declarations: [
        Server,
        Default404Route,
    ]
})
export class Router extends RequestHandler implements OnConfigure, OnInit {

    @InjectConfiguration<RouterConfiguration>({
        host: '127.0.0.1',
        port: 8080,
        maxRequestMs: 15 * 60 * 1e3,
        handlers: []
    })
    private configuration: RouterConfiguration;

    @Inject(Server, randomBytes(16).toString('hex'))
    private server: Server;

    constructor(protected logger: Logger) {
        super(logger);
    }

    get pathsOAS(): PathsOAS {
        return this.handlers.reduce((acc: PathsOASAccumulator, cur: RequestHandler) => {
            acc.out[cur.path] = cur;
            return acc;
        }, {
            out: {},
            currentObject: {},
            currentSegment: []
        })
            .out;
    }

    get tree(): RouteTree {
        return new RouteTree(this);
    }

    get url(): string {
        const url = this.server.url;
        if (typeof url === 'string') {
            return url;
        }
        return `${url.address}:${url.port}`;
    }

    async onConfigure() {
        this.server['config'] = {
            ...this.configuration
        };
    }

    async onInit() {
        this.server.handler = (req, res) => {
            this.kickOfHandling.apply(this, [req, res]);
        }
    }

    async kickOfHandling(req: IncomingMessage, res: ServerResponse) {
        const context = new RequestContext(
            req,
            res,
            Logger.build()
                .copySettingsFrom(this.logger)
                .className('RequestContext')
                .create()
        );

        context.setHeader('TNA-HTTP-Version', tnaHttpVersion);

        this.logger.info(`Kicking off request ${context.id}`)
        const timeout = setTimeout(() => {
            this.logger.warn(`Closing request ${context.id} because of timeout (${this.configuration.maxRequestMs})`);
            context.error = new RequestTimeoutError();
        }, this.configuration.maxRequestMs);

        context.addErrorCallback(() => clearTimeout(timeout));

        res.on('finish', () => {
            this.logger.info(`Response ${context.id} finished with ${res.statusCode}`);
            clearTimeout(timeout)
        });

        let body;
        try {
            body = await this.handleRequest(context);
        } catch (error) {
            if (error instanceof HttpError) {
                context.error = error;
                this.logger.warn(`Request ${context.id} ran into an error: ${error.message}`);
            } else {
                this.logger.error(`Failed to handle request ${context.id}`, error);
                context.error = new HttpError(error.message);
            }
            return;
        }

        if (body !== undefined) {
            if (typeof body === 'object' && !Buffer.isBuffer(body)) {
                if (!res.getHeader('Content-Type')) {
                    res.setHeader('Content-Type', 'application/json');
                }
                this.logger.spam('Stringifying object body:', body);
                body = Buffer.from(JSON.stringify(body));
            }
            body = Buffer.from(body);
            res.setHeader('Content-Length', body.byteLength);
            res.write(body);
        }

        res.end();
    }

    async shutdown() {
        return this.server.shutdown();
    }
}
