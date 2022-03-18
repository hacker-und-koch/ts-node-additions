import { Application, bootstrap, OnReady, Injectable, config, Inject } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';
import { DataType, Mandatory } from '@hacker-und-koch/type-store';
import { equal as assertEqual } from 'assert/strict';

import {
    InvalidRequestError,
    Router,
    RequestHandler,
    Route,
    RouterConfiguration,
    RequestContext,
    NotFoundError,
    UndiciClient,
    UndiciClientOptions,
    Get,
    Post,
} from './lib';


@Route({
    path: '/hi',
    setHeaders: {
        'Custom-Foo': 'BarBaz'
    },
    matchExact: true,
})
class SomeRoute extends RequestHandler {
    // assign handler function
    @Get({
        description: 'Says hello.',
        responses: {
            200: 'text/html'
        }
    })
    async greet(ctx: RequestContext): Promise<string> {
        // generate arbitrary error when search params are detected
        if (ctx.hasSearch) {
            this.logger.log('Query params:', ctx.search);
            throw new InvalidRequestError('DemoError: Not supporting query params');
        }

        // reply kindly
        return 'hello, planet!';
    }
}

@DataType()
class ValueMessage {
    @Mandatory()
    value: string;
}

@DataType()
class SuccessMessage {
    @Mandatory()
    success: boolean;
}

@Route({
    path: '/values/{id}',
})
class ValuesRoute extends RequestHandler {
    // create pseudo storage
    private storage = new Map<string, any>();

    @Get({
        responses: {
            200: ValueMessage,
        }
    })
    async readValue(ctx: RequestContext) {
        // get 'id' variable
        const id = ctx.pathVariables.get('id');

        // return value if present
        if (this.storage.has(id)) {
            return this.storage.get(id);
        }

        throw new NotFoundError('Unknown ID');
    }

    @Post({
        body: ValueMessage,
        responses: {
            201: SuccessMessage,
        },
    })
    async setValue(ctx: RequestContext) {
        // get 'id' variable
        const id = ctx.pathVariables.get('id');

        this.logger.info('Headers:', ctx.inboundHeaders);

        // get body
        const body = await ctx.jsonBody;
        this.logger.log(`Setting '${id}' to`, body);

        // set in pseudo storage
        this.storage.set(id, body);

        // set response code
        ctx.status = 201;

        // reply success
        return { success: true }
    }
}

@Route({
    path: '/api',
    handlers: [
        ValuesRoute,
    ],
})
class ApiRoute extends RequestHandler {
    // just a container for Values Route
}

@Injectable()
export class Default404Route /* DO NOT EXTEND REQUESTHANDLER!! */ {

    async handle(ctx: RequestContext): Promise<string> {
        ctx.status = 404;

        ctx.setHeader('Content-Type', 'text/html;charset=utf-8');

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
        UndiciClient,
    ],
    configs: [
        config<RouterConfiguration>(Router, {
            handlers: [
                SomeRoute,
                ApiRoute,
            ]
        }),
        config<UndiciClientOptions>(UndiciClient, {
            url: 'http://localhost:8080',
            options: {
                method: 'GET',
                headers: {
                    'Demo-App': 'active'
                }
            }
        }, 'req-1')
    ]

})
class App implements OnReady {
    constructor(private router: Router, private logger: Logger) { }

    @Inject(UndiciClient, 'req-1')
    private undici: UndiciClient;

    async onReady() {
        this.logger.log('ready' + this.router.tree);

        this.logger.log('Request finished:', (await this.undici.request('/hi')).statusCode);

        const createStatus = (await this.undici.request('/api/values/foo', {
            method: 'POST',
            body: JSON.stringify({ lorem: 'ipsum' }),
        })).statusCode;

        assertEqual(createStatus, 201);

        const value = await (
            await this.undici.request('/api/values/foo')
        ).body.json();

        this.logger.log('Did read value:', value);

        this.router.shutdown();
    }
}

bootstrap(App, {
    log: {
        '*': 'log',
        // Router: 'spam',
        // ApiRoute: 'spam',
        // RequestHandler: 'spam',
    },
});
