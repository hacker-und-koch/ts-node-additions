import { bootstrap, Application, Inject, Injectable } from "@hacker-und-koch/di";
import { Logger } from "@hacker-und-koch/logger";
import { Eventbus } from "./lib";
import { interval } from "rxjs";
import { scan, map, take } from "rxjs/operators";


type MyAction = 'hello' | 'planet';
interface MyPayload {
    message: string;
    at: number;
}


@Injectable()
class Worker1 {
    constructor(private bus: Eventbus<MyAction, MyPayload>, private logger: Logger) { }

    onInit() {
        const stop = this.bus.on('hello', x => this.logger.log(x.message));

        setTimeout(stop, 4000);
    }
}

@Application({
    declarations: [
        Worker1,
        Eventbus,
    ]
})
class App {
    constructor(private bus: Eventbus<MyAction, MyPayload>, worker: Worker1) { }

    onReady() {
   
        interval(500)
            .pipe(
                take(10),
                scan(n => n + 1),
                map(n => ({
                    at: Date.now(),
                    message: `Event #${n + 1}`,
                }))
            ).subscribe(data => this.bus.send({ action: 'hello', data }))
    }
}

bootstrap(
    App
);
