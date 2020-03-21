import { Injectable, InjectConfiguration, Inject, OnConfigure, OnInit } from '@hacker-und-koch/di';
import { Server, ServerConfiguration } from './server';
import { randomBytes } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { Logger } from '@hacker-und-koch/logger';
import { Default404Route } from './default-404.route';
import { Response, Request } from './models';
import { RequestHandler } from './request-handler';
import { HandlingError } from './errors';

export interface RouterOptions extends ServerConfiguration {
    maxRequestSeconds?: number;
}

@Injectable({
    declarations: [
        Server,
        Default404Route,
    ]
})
export class Router extends RequestHandler<void, void> implements OnConfigure, OnInit {

    @InjectConfiguration<RouterOptions>({
        host: '127.0.0.1',
        port: 8080,
        maxRequestSeconds: 15 * 60 * 1e3,
    })
    private configuration: RouterOptions;

    @Inject(Server, randomBytes(4).toString('hex'))
    private server: Server;

    constructor(protected logger: Logger) {
        super(logger);
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
        const request: Request<unknown> = this.genRequest(req);
        const response: Response = this.genResponse(res);

        this.logger.spam(`Handling request ${request.id}.`)
        const timeout = setTimeout(() => {
            this.logger.warn(`Closing request ${request.id} because of timeout.`);
            res.statusCode = 408;
            res.end();
        }, this.configuration.maxRequestSeconds);

        res.on('finish', () => {
            this.logger.spam(`Request ${request.id} finished with ${res.statusCode}.`);
            clearTimeout(timeout)
        });

        let body: unknown;
        try {
            body = await this.handleRequest(request, response);
        } catch (e) {
            if (e instanceof HandlingError) {
                res.statusCode = e.statusCode;
                res.write(e.message);
            } else {
                this.logger.error(`Failed to handle request ${request.id}.`, e);
                res.statusCode = 500;
            }
            res.end();
            return;
        }

        if (typeof body !== 'undefined') {
            res.write(Buffer.from(body));
        }

        res.end();
    }

    private genRequest(req: IncomingMessage): Request<unknown> {
        return {
            _raw: req,
            async body() { },
            parsedUrl: parseUrl(req.url, true),
            id: randomBytes(12).toString('hex'),
            parameters: {}
        };
    }

    private genResponse(res: ServerResponse): Response {
        const result = {
            _raw: res,
            status: (code: number) => {
                res.statusCode = code;
                return result;
            },
            headers: (headers: { [key: string]: string }) => {
                for (let name of Object.keys(headers)) {
                    res.setHeader(name, headers[name]);
                }
                return result;
            }
        };
        return result;
    }
}
