import {
    Application,
    bootstrap,
    Option,
    Argument
} from '../lib';
import { GetOpt } from '@tna/getopt';


@Application({
    getopt: {

        options: [{
            long: "greeting",
            type: 'string',
            default: "hello",
            short: "g"
        }],
        args: [{
            name: 'greet',
            command: true,
            info: 'example command argument',
            children: [
                {
                    name: 'child',
                    info: 'child argument'
                },
            ]
        }]
    }
})
class App {

    @Option("greeting")
    private foo: string;

    @Argument('greet.child')
    private bar: string;

    constructor(private getopt: GetOpt) {

    }

    onConfigure() {
        console.log(this.foo, this.bar);
    }

    onReady() {
        if (this.foo === 'hello') {
            console.log("Try --greeting <word> for more demo. Or --help for further information.");
        } 
    }
}

// console.log(App);
// console.log(Worker);

bootstrap(App, {
    log: "spam",
});
