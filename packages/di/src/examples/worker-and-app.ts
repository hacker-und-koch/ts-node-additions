import { Injectable, bootstrap, Application } from '../lib';

@Injectable()
class Worker {
    constructor() {
        console.log("worker lives")
    }
    doSome() {
        console.log("worker does something");
    }
}


@Application({
    declarations: [
        Worker
    ]
})
class App {
    
    constructor(private worker: Worker) {
        console.log("app lives");
        this.worker.doSome();
    }

}

// console.log(App);
// console.log(Worker);

bootstrap(App, {
    log: "spam"
});
