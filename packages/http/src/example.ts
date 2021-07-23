import { Application, bootstrap, OnReady, Injectable, config } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';

import {
    Router,
    Request,
    Response,
    RequestHandler,
    HandlingError,
    Route,
    RouterConfiguration,
} from './lib';

@Route({
    path: '/hi',
})
class SomeRoute extends RequestHandler {
    async handle(): Promise<string> {
        if (this.ctx.hasSearch) {
            this.logger.log('Query params:', this.ctx.search);
            throw new HandlingError('Not supporting queries!', 400);
        }
        return 'hello, planet!';
    }
}

@Route({
    path: '/values/{id}',
})
class ValuesRoute extends RequestHandler {
    
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

    async handle(req: Request, res: Response): Promise<string> {
        res.status(404)
            .headers({
                'content-type': 'text/html',
            });

        return 'Not found. <a href="/hi">try</a>';
    }
}

@Application({
    declarations: [
        Router,
        SomeRoute,
        Default404Route,
        ApiRoute,
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
    },
});
