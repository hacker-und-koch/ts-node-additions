import { Application, bootstrap, config, Injectable, InjectConfiguration, OnConfigure } from '../lib';

interface MyWorkerConfig {
    myOption: string;
}

@Injectable()
class MyWorker implements OnConfigure {

    @InjectConfiguration()
    private config: MyWorkerConfig;

    onConfigure() {
        console.log(`My option is: ${this.config.myOption}`);
    }
}

@Application({
    declarations: [
        MyWorker,
    ],
    configs: [
        config<MyWorkerConfig>(MyWorker, {
            myOption: 'foo',
        }),
    ],
})
class MyApp {
    constructor(private worker: MyWorker) { }
}

bootstrap(MyApp);
