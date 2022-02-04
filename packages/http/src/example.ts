import { Application, bootstrap, OnReady, Injectable, config, Inject } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';
import { runInThisContext } from 'vm';

import {
    InvalidRequestError,
    Router,
    RequestHandler,
    Route,
    RouterConfiguration,
    RequestContext,
    NotFoundError,
    HttpClient,
    HttpClientConfiguration,
    request,
} from './lib';


@Route({
    path: '/hi',
    setHeaders: {
        'Custom-Foo': 'BarBaz'
    },
    matchExact: true,
})
class SomeRoute extends RequestHandler {
    async handle(ctx: RequestContext): Promise<string> {
        if (ctx.hasSearch) {
            this.logger.log('Query params:', ctx.search);
            throw new InvalidRequestError('DemoError: Not supporting query params');
        }
        return 'hello, planet!';
    }
}

@Route({
    path: '/values/{id}',
    methods: ['GET', 'POST']
})
class ValuesRoute extends RequestHandler {
    private storage = new Map<string, any>();
    async handle(ctx: RequestContext) {
        const id = ctx.pathVariables.get('id');
        if (ctx.method === 'POST') {
            const body = await ctx.jsonBody;
            this.logger.log(`Setting ${id} to`, body);
            this.storage.set(id, body);
            return { success: true }
        }
        if (this.storage.has(id)) {
            return this.storage.get(id);
        }
        throw new NotFoundError('Unknown ID');
    }
}

@Route({
    path: '/api',
    handlers: [
        ValuesRoute,
    ],
})
class ApiRoute extends RequestHandler {

}

@Injectable()
export class Default404Route /* DO NOT EXTEND REQUESTHANDLER!! */ {

    async handle(ctx: RequestContext): Promise<string> {
        ctx.status = 404;

        // todo: parse from Route decorator or something
        ctx.original.res.setHeader('content-type', 'text/html');

        return 'Not found. <a href="/hi">try</a>';
    }
}

@Application({
    declarations: [
        Router,
        SomeRoute,
        Default404Route,
        ApiRoute,
        ValuesRoute,
        HttpClient,
    ],
    configs: [
        config<RouterConfiguration>(Router, {
            handlers: [
                SomeRoute,
                ApiRoute,
            ]
        }),
        config<HttpClientConfiguration>(HttpClient, {
            // url

            baseUrl: 'http://localhost:8080',
            // defaultMethod: 'POST',
        }, 'example-1')
    ]

})
class App implements OnReady {
    constructor(private router: Router, private logger: Logger) {}

    @Inject(HttpClient, 'example-1')
    private exampleRequestOne: HttpClient;

    async onReady() {
        this.logger.log('ready');
        try {
            this.logger.log(await this.exampleRequestOne.call('http://localhost:8080/hi').body);
        } catch(err) {
            this.logger.warn('Failed to make request:', err);
        }
        // this.logger.log(
        //     request('http://localhost:8080/api/values/foo', {
        //         method: 'POST'
        //     }, {
        //         a: 'b'
        //     }).body
        // );
    }
}

bootstrap(App, {
    log: {
        '*': 'info',
        'Router': 'spam',
        ApiRoute: 'spam',
        RequestHandler: 'spam',
    },
});
