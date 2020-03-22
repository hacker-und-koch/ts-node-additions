import {
    Injectable,
    Application,
    OnConfigure,
    OnInit,
    OnReady,
    OnDestroy,
    bootstrap
} from '../lib';
import { delay, infinite } from '@hacker-und-koch/util';


@Injectable()
class Worker implements OnConfigure, OnInit, OnReady, OnDestroy {

    async onConfigure() {
        console.log("worker configure");

        await delay(1000);
    }

    async onInit() {
        console.log("worker init");
        await delay(1000);
    }

    onReady() {
        console.log("worker ready");
    }

    async onDestroy() {
        console.log("worker destroy");
        await delay(1000);
    }

}


@Application({
    declarations: [
        Worker
    ]
})
class App {

    constructor(private worker: Worker) { }

    async onConfigure() {
        console.log("app configure");
        await delay(1000);
    }

    async onInit(cb: () => void) {
        console.log("app init");
        await delay(1000);
    }

    async onReady() {
        console.log("app ready.");
        console.log("Ctrl + c to terminate.");
        await infinite();

    }

    async onDestroy(cb: () => void) {
        console.log("app destroy");
        await delay(1000);
    }

}

// console.log(App);
// console.log(Worker);

bootstrap(App, {
    log: "spam"
});
