import { Application, bootstrap, OnReady, Injectable } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';

import {
    Router,
    Request,
    Response,
    RequestHandler,
    HandlingError,
    Route,
} from './lib';

function ParseJson(foo: any) {

}

@Route({
    path: '/hi',
    children: [

    ]
})
export class SomeRoute extends RequestHandler {
    async handle(req: Request, res: Response): Promise<string> {
        if ([...req.parsedUrl.searchParams.keys()].length) {
            this.logger.log('Query params:', req.parsedUrl.searchParams);
            throw new HandlingError('Not supporting queries!', 400);
        }
        return 'hello, planet!';
    }
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
    ]
})
class App implements OnReady {
    constructor(private router: Router, private route: SomeRoute, private logger: Logger) {

    }

    onInit() {
        this.router.use(this.route);
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
