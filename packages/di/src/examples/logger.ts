import { Injectable, bootstrap, Application, Inject, OnReady } from '../lib';
import { Logger } from '@tna/logger';

@Injectable()
class Worker {
    constructor(private logger: Logger) {
        this.logger.info("alive");
    }
    doSome() {
        this.logger.log(`doing something`);
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
        this.logger.info("alive");
    }

    onReady() {
        this.logger.log("ready");

        this.worker1.doSome();
        this.worker2.doSome();
    }
}

bootstrap(App, {
    log: "spam"
});

