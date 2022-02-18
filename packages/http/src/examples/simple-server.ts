import { Application, bootstrap, config, Logger, OnReady } from '@hacker-und-koch/di';
import { Get, RequestHandler, Route, Router, RouterConfiguration } from '../lib';

@Route({
    path: '/',
})
class HelloRoute extends RequestHandler {
    @Get
    async greet(): Promise<string> {
        // simple strings and objects can be returned to finish request
        return 'hello, planet!';
    }
}


@Application({
    declarations: [
        Router,
        HelloRoute,
    ],
    configs: [
        config<RouterConfiguration>(Router, {
            handlers: [
                HelloRoute,
            ]
        }),
    ]

})
class App implements OnReady {
    constructor(
        private router: Router,
        private logger: Logger
    ) { }

    async onReady() {
        this.logger.log('ready');
    }
}

bootstrap(App);
