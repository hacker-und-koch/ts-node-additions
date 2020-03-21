import { Injectable, bootstrap, Application, Inject, OnReady } from './lib';
import { Logger } from '@hacker-und-koch/logger';

@Injectable()
class Worker {
    constructor(private logger: Logger) {
        this.logger.spam("alive");
    }
    doSome() {
        this.logger.info(`doing something`);
    }
}

@Application({
    declarations: [
        Worker
    ]
})
class App implements OnReady {

    @Inject(Worker, "foo")
    private worker1: Worker;

    @Inject(Worker, "bar")
    private worker2: Worker;

    constructor(private logger: Logger) {
        this.logger.spam("alive");
    }

    onReady() {
        this.worker1.doSome();
        this.worker2.doSome();

        this.logger.log("ready");
    }

}

bootstrap(App, {
    log: {
        '*': 'log',
        Worker: 'info'
    },
});

// replace with above bootstrap(...) for more demo
// bootstrap(App, {
//     log: "spam"
// });
