import {
    Application,
    bootstrap,
    Option,
    Argument,
    CommandState,
} from '../lib';
import { GetOpt } from '@hacker-und-koch/getopt';


@Application({
    getopt: {

        options: [{
            long: "greeting",
            type: 'string',
            default: "hello",
            short: "g"
        }],
        // args: [{
        //     name: 'greet',
        //     command: true,
        //     info: 'example command argument',
        //     children: [
        //         {
        //             name: 'entity',
        //             info: 'entity to greet',
        //         },
        //     ]
        // }]
    }
})
class App {

    @Option("greeting")
    private greeting: string;

    constructor(private getopt: GetOpt) {
        console.log(`During construction >> greeting: ${this.greeting};`);
        // console.log(`(Direct access is already possible: ${JSON.stringify(getopt.options)})`);
    }

    onConfigure() {
        console.log(`During configuration >> greeting: ${this.greeting};`);
    }

    onReady() {
        console.log(`${this.greeting} planet!`);
        if (this.greeting === 'hello') {
            console.log('Try --greeting <word> for more demo.');
        } else {
            console.log('Use --help to get more information.');
        }
    }
}

bootstrap(App, {
    log: 'log'
});
