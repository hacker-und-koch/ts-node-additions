import { Application, bootstrap, OnReady, Injectable } from '@tna/di';
import { Logger } from '@tna/logger';

import { Server, Router, Request, Response, RequestHandler, HandlingError } from './lib';


@Injectable()
export class SomeRoute extends RequestHandler<void, string> {
    path: string = '/hi';

    async handle(req: Request<void>, res: Response): Promise<string> {
        if (Object.keys(req.parsedUrl.query).length > 0) {
            this.logger.log('QUERY:', req.parsedUrl.query);
            throw new HandlingError('Not supporting queries!', 400);
        }
        return 'hello, planet!';
    }
}

@Injectable()
export class Default404Route /* DO NOT EXTEND REQUESTHANDLER!! */ {

    async handle(req: Request<void>, res: Response): Promise<string> {
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
