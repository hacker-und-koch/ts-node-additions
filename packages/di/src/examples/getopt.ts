import {
    Application,
    bootstrap,
    Option,
    Arguments,
} from '../lib';
import { GetOpt } from '@hacker-und-koch/getopt';


@Application({
    getopt: {
        appName: 'greet-example',
        options: [{
            type: 'string',
            long: 'greeting',
            short: 'g',
            default: 'hello',
            valueName: 'word',
            envAlias: 'GETOPT_GREETING'
        }],
        positionalArgs: [
            {
                name: 'something',
            }
        ]
    }
})
class App {

    @Option('greeting')
    private greeting: string;

    @Arguments()
    private args: string[];

    constructor(getopt: GetOpt) {
        // console.log(`Member during construction >> ${this.greeting};`);
        // console.log(`Access via constructor arg >> ${getopt.option('greeting').value}`);
    }

    onConfigure() {
        // console.log(`Member during configuration >> ${this.greeting};`);
    }

    onReady() {
        const entity = this.args.length ? this.args[0] : 'planet';
        console.log(` >> ${this.greeting}, ${entity || 'planet'}! <<`);
        if (this.greeting === 'hello') {
            console.log('Try --greeting <word> for more demo.');
        } else if (entity === 'planet') {
            console.log('Try --help to explore some more.');
        } else {
            console.log(`Consult ./packages/di/src/examples/getopt.ts for more details.`);
        }
    }
}

bootstrap(App, {
    log: 'log'
});
