import {
    ArgumentError,
    DoublicateOptionError,
    MissingCommandError,
    MissingValueError,
    NormalizationFailedError,
    OptionNotProvidedError,
    UnknownOptionError,
} from "./errors";
import * as util from 'util';

export declare type GetOptValueType = 'string' | 'boolean' | 'array';
export declare type GetOptOptionsValue = string | boolean | string[];

export interface GetOptUntypedOption<T, D> {
    type: T;
    long: string;
    short?: string;
    env?: string;
    default?: D;
    required?: boolean;
    info?: string;
};

export declare type GetOptStringOption = GetOptUntypedOption<'string', string>;
export declare type GetOptArrayOption = GetOptUntypedOption<'array', string[]>;
export declare type GetOptBooleanOption = Omit<GetOptUntypedOption<'boolean', boolean>, 'required'>;
export declare type GetOptDefaultOption = Omit<GetOptBooleanOption, 'type'>;

export declare type GetOptOption =
    GetOptStringOption |
    GetOptArrayOption |
    GetOptBooleanOption |
    GetOptDefaultOption;

export declare type GetOptPositionalArguments = string[] & {
    $0: string;
    $1: string;
}
export declare type GetOptOptionsValues = {
    [key: string]: GetOptOptionsValue;
}

export declare type GetOptOptions = GetOptOption[];

export interface BasicPositionalArgument {
    name: string;
    info?: string;
    children?: PositionalTree[];
    required?: boolean;
}
export interface SpreadingPositionalArgument extends Omit<BasicPositionalArgument, 'children'> {
    spreads: boolean;
}
export interface PositionalCommandArgument extends Omit<BasicPositionalArgument, 'required'> {
    command: boolean;
}

export declare type PositionalTree = SpreadingPositionalArgument | BasicPositionalArgument | PositionalCommandArgument;

export interface GetOptConfiguration {
    options?: GetOptOptions;
    args?: PositionalTree[];
    argv?: string[];
    env?: { [key: string]: string };
}

export class GetOpt {
    private configuration: GetOptConfiguration;

    private _normalizedArgv: string[] = [];
    private _positionalTree: any;
    private _activeCommandChain: string[] = [];
    private _activeCommandNode: PositionalTree[] = [];

    options: GetOptOptionsValues = {};
    positional: GetOptPositionalArguments = Object.assign([], {
        $0: '<unset>',
        $1: '<unset>',
    }) as GetOptPositionalArguments;

    constructor(configuration: GetOptConfiguration) {
        this.configuration = Object.assign({
            args: null,
            options: [],
            argv: process.argv,
            env: process.env
        } as GetOptConfiguration, configuration);
        this.configuration.options = [
            ...this.configuration.options,
            {
                long: 'help',
                short: 'h',
                type: 'boolean',
                info: 'Print command info.'
            }
        ];

        try {
            this.parseOptions();
        } catch (e) {
            if (e instanceof OptionNotProvidedError && this.options.help) {
                // ignore this error. help is on the way.
            } else {
                throw e;
            }
        }

        try {
            this.parsePositionalArguments();
        } catch (err) {
            if (err instanceof MissingCommandError) {
                if (this.options.help) {
                    // ignore this error. help is on the way.
                } else {
                    console.error(err.message);
                    this.printHelp();
                    process.exit(1);
                }
            } else if (err instanceof ArgumentError) {
                if (this.options.help) {
                    // ignore this error. help is on the way.
                } else {
                    console.error(err.message);
                    this.printHelp();
                    process.exit(2);
                }
            } else {
                throw err;
            }
        }

        if (this.options.help) {
            this.printHelp();
            process.exit(0);
        }
    }

    get posTree(): any {
        return this._positionalTree;
    }

    private parseOptions() {
        const options = this.configuration.options;
        let argv = [...(this.configuration.argv || process.argv)];

        this.positional.$0 = argv.shift();
        this.positional.$1 = argv.shift();

        argv = this.normalizeArgv(argv, options);
        this._normalizedArgv = [...argv];

        let optionsDisabled = false;

        while (argv.length) {
            const segment = argv.shift();

            if (segment === '--' && !optionsDisabled) {
                // disable option parsing
                optionsDisabled = true;
            } else if (optionsDisabled || segment.charAt(0) !== '-') {
                // is positional argument
                this.positional.push(segment);
            } else if (segment.charAt(1) === '-') {
                // is long option

                const idxOfEql = segment.indexOf('=');
                const endIdx = idxOfEql > -1 ? idxOfEql : segment.length;
                const name = segment.substring(2, endIdx);
                const relatedOption: GetOptOption = options.find(option => option.long === name);

                if (!relatedOption) {
                    throw new UnknownOptionError(`--${name}`);
                }

                switch ((relatedOption as any).type) {
                    case undefined:
                    case "boolean":
                        this.options[name] = true;
                        break;

                    case "array":
                    case "string":
                        let val: string;

                        if (idxOfEql > -1) {
                            val = segment.substring(idxOfEql + 1, segment.length);
                        } else {
                            // take argv[0] as value if not an option
                            if (argv[0].charAt(0) === '-') {
                                throw new MissingValueError(`--${name}`, (relatedOption as any).type);
                            } else {
                                val = argv.shift();
                            }
                        }
                        if ((relatedOption as any).type === "array") {
                            if (!Array.isArray(this.options[name])) {
                                this.options[name] = [val];
                            } else {
                                (this.options[name] as string[]).push(val);
                            }
                        } else if (typeof this.options[name] !== 'undefined') {
                            throw new DoublicateOptionError(`--${name}`, this.options[name] as string, val);
                        } else {
                            this.options[name] = val
                        }
                        break;
                }
            } else {
                // is short option or options
                throw new NormalizationFailedError('Should not run into case where short options are in argv. But ' + segment + ' is present.');
            }
        }

        this.checkAndFillRequiredOptions(options);
    }

    private printHelp() {
        const commandHelp = this.commandHelp();
        const positionalHelp = this.positionalHelp();
        const optionsPart = this.optionsHelp();

        console.error(
            `USAGE\n` +
            `  ${commandHelp}\n\n` +
            `ARGUMENTS\n` +
            `${positionalHelp}\n` +
            `OPTIONS\n` +
            `${optionsPart}`
        );
    }

    private optionsHelp(): string {
        const buildingBlocks = this.configuration
            .options
            .map(option => {
                const short = option.short ? `  -${option.short}, ` : '      ';
                let long = `--${option.long} `;

                if ((option as GetOptStringOption).type === 'string' || (option as GetOptArrayOption).type === 'array') {
                    long += `<val> `;
                }
                const info = option.info || 'TODO: write info text';
                return {
                    short,
                    long,
                    info,
                    option,
                }
            }).reduce((acc, item) => {
                const champ = acc.longestLength;
                const self = item.long.length;
                const longestLength = self > champ ? self : champ;

                return Object.assign(
                    [...acc, item],
                    { longestLength },
                );
            }, Object.assign([], { longestLength: 0, }));
        const { longestLength } = buildingBlocks;

        return buildingBlocks
            .reduce((acc, item) => {
                acc += item.short;
                acc += item.long.padEnd(longestLength + 1, '.');
                acc += ` (${item.option.type || 'boolean'}) `.padEnd(12, '.');
                acc += ` ${item.info}\n`;

                let indentByPrintEnv = '';
                if (item.option.env) {
                    const envText = `\\[env variable] ${item.option.env}\n`;
                    acc += envText.padStart(longestLength + 21 + envText.length, ' ');
                    indentByPrintEnv = ' ';
                }
                if (item.option.default) {
                    const envText = `${indentByPrintEnv}\\[default] ${JSON.stringify(item.option.default)}\n`;
                    acc += envText.padStart(longestLength + 21 + envText.length, ' ');
                }
                return acc;
            }, '');
    }

    private parsePositionalArguments() {
        const out: any = {};
        const posArgs = [...this.positional];

        let node: PositionalTree[] = [...this.configuration.args];
        this._activeCommandNode = [...node];

        const collector = { collector: out };
        let valNode: any = collector;
        let valKey: string = 'collector';

        if (node && node.length) {
            let arg = null;
            let tree: PositionalTree;

            let discontinue = false;
            while ((arg = posArgs.shift()) && !discontinue) {
                while (tree = node.shift()) {
                    const treeIsCommand = (tree as PositionalCommandArgument).command;
                    if (treeIsCommand && tree.name === arg) {

                        valNode[valKey][tree.name] = {};
                        valNode = valNode[valKey];
                        valKey = tree.name;
                        node = [...(tree as PositionalCommandArgument).children];

                        this._activeCommandChain.push(tree.name);
                        this._activeCommandNode = [...node];
                        break;
                    } else if ((tree as SpreadingPositionalArgument).spreads) {
                        if (Array.isArray(valNode[valKey])) {
                            valNode[valKey].push(arg);
                        } else {
                            valNode[valKey][tree.name] = [arg];

                            valNode = valNode[valKey];
                            valKey = tree.name;

                        }
                        node = [tree];

                        break;
                    } else if (!treeIsCommand) {
                        Object.assign(valNode[valKey], { [tree.name]: arg });
                        break;
                    }

                    discontinue = !treeIsCommand;
                }

                if (typeof tree === 'undefined') {
                    throw new ArgumentError('Unhandled arguments detected: ' + arg);
                }
            }
        }

        return this._positionalTree = out;
    }

    private positionalHelp(): string {
        let out = '';
        const longestName = this._activeCommandNode
            .reduce((acc, node) =>
                node.name.length > acc ? node.name.length : acc,
                0);

        // dirty way to get command handling
        const handleAsCommand = (this._activeCommandNode[0] as PositionalCommandArgument).command;
        if (handleAsCommand) {
            out += `  command -> choose from:\n`;
        }
        for (let node of this._activeCommandNode) {
            if (handleAsCommand) {
                out += `    * ${(node.name + ' ').padEnd(longestName + 2, '.')} ${node.info}\n`;
            } else {
                out += `  ${node.name.padEnd(longestName)} -> ${node.info}\n`;
            }
        }
        return out;
    }
    private commandHelp(): string {
        let out = this.positional.$1;

        for (let command of this._activeCommandChain) {
            out += ` ${command}`;
        }

        // dirty way to get command handling
        if ((this._activeCommandNode[0] as PositionalCommandArgument).command) {
            out += ` <command>`; 
        } else {
            for (let arg of this._activeCommandNode) {
                const spreadChars = (arg as SpreadingPositionalArgument).spreads ? '...' : '';
    
                if ((arg as BasicPositionalArgument).required) {
                    out += ` <${spreadChars}${arg.name}>`;
                } else {
                    out += ` [${spreadChars}${arg.name}]`;
                }
            }
        }


        out += ` [...options]`;
        return out;
    }

    private checkAndFillRequiredOptions(options: GetOptOptions) {
        const env = this.configuration.env || process.env;

        for (let option of options) {
            const name = option.long;
            const envVar = option.env;
            if (typeof this.options[name] === 'undefined') {
                if (envVar && envVar in env) {
                    switch ((option as any).type) {
                        case undefined:
                        case 'string':
                            this.options[name] = env[envVar];
                            break;
                        case 'array':
                            this.options[name] = env[envVar].split(',');
                            break;
                        case 'boolean':
                            this.options[name] = true;
                            break;
                    }
                } else if (typeof (option as GetOptStringOption | GetOptArrayOption).default !== 'undefined') {
                    this.options[name] = (option as GetOptStringOption | GetOptArrayOption).default;
                } else if ((option as GetOptStringOption).required) {
                    throw new OptionNotProvidedError(option.long);
                }
            }
        }
    }

    private normalizeArgv(argv: string[], options: GetOptOptions) {
        return argv
            .reduce((acc, arg) => {
                if (arg === '--') {
                    acc.stop = true;
                    return { ...acc, arr: [...acc.arr, arg] };
                } else if (acc.stop || !/^-[^-].*$/.test(arg)) {
                    return { ...acc, arr: [...acc.arr, arg] };
                }

                const collector = [];
                const [shortOpt, val] = arg.split('=');
                for (let i = 1; i < shortOpt.length; ++i) {
                    const relevantOption = options.find(opt => opt.short === shortOpt[i]);

                    if (!relevantOption) {
                        throw new UnknownOptionError(`-${shortOpt}`);
                    }

                    collector.push(`--${relevantOption.long}${val ? `=${val}` : ''}`);
                }

                return { ...acc, arr: [...acc.arr, ...collector] };
            }, { arr: [], stop: false })
            .arr;
    }
}
