import { Injectable, bootstrap, Application } from '../lib';

@Injectable()
class InnerWorker {
    constructor() {
        console.log("inner worker lives");
    }
    doSome() {
        console.log("inner worker does something");
    }
}

@Injectable()
class OuterWorker {
    constructor(private worker: InnerWorker) {
        console.log("outer worker lives");
    }

    doSome() {
        console.log("outer worker does something");
        this.worker.doSome();
    }
}

@Application({
    declarations: [
        InnerWorker,
        OuterWorker,
    ]
})
class App {
    constructor(private worker: OuterWorker) {
        console.log("app lives");
        this.worker.doSome();
    }
}

bootstrap(App, {
    log: "spam"
});
