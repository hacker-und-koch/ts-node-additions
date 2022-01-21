import { Application, bootstrap, OnReady, Injectable, config } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';

import {
    InvalidRequestError,
    Router,
    RequestHandler,
    Route,
    RouterConfiguration,
    RequestContext,
} from './lib';


@Route({
    path: '/hi',
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
    async handle(ctx: RequestContext) {
        return `Nice ${ctx.method} for ${ctx.pathVariables.get('id')}!`;
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
    ],
    configs: [
        config<RouterConfiguration>(Router, {
            handlers: [
                SomeRoute,
                ApiRoute,
            ]
        })
    ]
})
class App implements OnReady {
    constructor(private router: Router, private logger: Logger) {

    }

    onReady() {
        this.logger.log('ready');
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
