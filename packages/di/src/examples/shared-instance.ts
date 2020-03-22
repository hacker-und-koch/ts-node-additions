import { Injectable, bootstrap, Application, Inject, OnReady } from '../lib';

@Injectable()
class Worker {
    private id: string;
    constructor() {
        console.log("worker lives");
        this.setId();
    }
    doSome() {
        console.log(`worker #${this.id} does something`);
    }

    setId() {
        this.id = (Math.random() * 1e9).toFixed(0);
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

    // replace to see difference
    // @Inject(Worker, "foo")
    @Inject(Worker, "bar")
    private worker2: Worker;

    constructor() {
        console.log("app lives");
    }

    onReady() {
        this.worker1.doSome();
        this.worker2.doSome();
    }

}

bootstrap(App, {
    log: "log"
});

