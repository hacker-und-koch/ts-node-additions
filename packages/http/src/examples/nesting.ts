import { Application, bootstrap, config, Logger, OnReady } from '@hacker-und-koch/di';
import { Get, RequestHandler, Route, Router, RouterConfiguration } from '../lib';

@Route({
    path: '/a',
})
class RouteA extends RequestHandler {
    @Get()
    async greet() {
        // simple strings and objects can be returned to finish request
        return Promise.resolve('Hello, you\'ve reached RouteA!');
    }
}

@Route({ path: '/x/y' }) class RouteXY extends RequestHandler { @Get() async demo() { return 'XY' } }
@Route({ path: '/x/z' }) class RouteXZ extends RequestHandler { @Get() async demo() { return 'XZ' } }

@Route({
    path: '/b',
    matchExact: true,
    handlers: [
        RouteXY,
        RouteXZ,
    ]
})
class RouteB extends RequestHandler {
    @Get()
    async greet(): Promise<string> {
        // simple strings and objects can be returned to finish request
        return 'Hello, you\'ve reached RouteB!';
    }
}

@Route({
    path: '/api',
    handlers: [
        RouteA,
        RouteB,
    ]
})
class APIRoute extends RequestHandler {

}


@Application({
    declarations: [
        Router,
        RouteA,
        RouteB,
        APIRoute,
        RouteXY,
        RouteXZ,
    ],
    configs: [
        config<RouterConfiguration>(Router, {
            handlers: [
                APIRoute,
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
        this.logger.log(this.router.tree + '');
    }
}

bootstrap(App);
