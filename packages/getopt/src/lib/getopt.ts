import { assert } from 'console';
import { argv as processArgv } from 'process';
import { MissingValueInShortArgs, UnknownOptionError, UnknownShortOptionError } from './errors';
import { ArrayOptionResult, GetOptConfiguration, OptionsResult } from './models';

export class GetOpt {
    constructor(
        private config: GetOptConfiguration = {
            options: [],
            positionalArgs: [],
        },
        private argv: string[] = processArgv,
        private processEnv: { [key: string]: string } = { ...process.env },
    ) {
        if (!this.config.options) {
            this.config.options = [];
        }
        if (!this.config.positionalArgs) {
            this.config.positionalArgs = [];
        }

        if (!this.config.noAutoHelp) {
            this.config.options.push({
                long: 'help',
                short: 'h',
                type: 'boolean',
                description: 'Print usage text.'
            });
        }

        this.evaluateArgs();

        if (!this.config.noAutoHelp && this.option('help')) {
            if (this.config.onPrintUsage) {
                this.config.onPrintUsage(this.usage);
            } else {
                console.log(this.usage);
                process.exit(0);
            }
        }
    }

    private argumentsCollector: string[] = [];
    private optionsCollector: OptionsResult[] = [];

    /**
     * Very first argument in argv. 
     * Usually full path binary that 
     * is called (e.g. /usr/bin/node). 
     */
    public get $0(): string {
        return this.argv[0];
    }
    /**
     * Second argument in argv.
     * Usually full path to executed file.
     * (e.g. /home/foo/project/example.js)
     */
    public get $1(): string {
        return this.argv[1];
    }

    /**
     * Unparsed list of arguments but with 
     * the first two elements removed.
     */
    public get rawArgs(): string[] {
        return this.argv.slice(2);
    }

    /**
     * Bundled summary of parser results.
     */
    public get result() {
        return {
            $0: this.$0,
            $1: this.$1,
            args: this.arguments,
            opts: this.options,
        };
    }

    /** 
     * Positional arguments. This will only
     * contain the elements, that were not 
     * recognized as an option or its value.
     */
    public get arguments(): string[] {
        return this.argumentsCollector.slice();
    }

    /**
     * Get full list of the options and their 
     * values that were found parsing argv.
     */
    public get options(): OptionsResult[] {
        // deep copy collector for safety reasons
        return this.optionsCollector
            .map(opt => ({ ...opt }));
    }

    /**
     * Get results for a single option.
     * @param name long option name (e.g. 'foo' for '--foo')
     */
    public option(name: string): OptionsResult | undefined {
        return this.options.find(opt => opt.label === name);
    }

    /**
     * Get results for a single option
     * by passing its short option key.
     * @param char short option char (e.g. 'k' for '-k')
     */
    public shortOption(char: string): OptionsResult | undefined {
        return this.options.find(opt =>
            this.config.options.find(o =>
                o.short === char
            )?.long === opt.label
        );
    }

    /**
     * Parse and return usage text.
     */
    public get usage(): string {
        const appName = this.config.appName || this.$1.split('/').reverse()[0];
        const optionsPart = this.config.options.length ? ' [options...]' : '';
        const argInfo = Array.isArray(this.config.positionalArgs) ?
            this.config.positionalArgs :
            this.config.positionalArgs(this.argv);
        const argPart = argInfo.reduce((acc, cur) => {
            let nextPart = '';
            let multiArg = cur.multi ? '...' : '';
            if (cur.maniditory) {
                nextPart += ` <${cur.name}${multiArg}>`;
            } else {
                nextPart += ` [${cur.name}${multiArg}]`;
            }
            return acc + nextPart;
        }, '');
        let usage = `Usage: ${appName}${optionsPart}${argPart}`;
        for (let opt of this.config.options) {
            usage += `\n`;
            usage += `${opt.short ? '-' + opt.short + ', ' : '    '}`;
            let optAndValue = opt.long;
            if (opt.type !== 'boolean') {
                optAndValue += ` <${opt.valueName || 'value'}>`;
            }
            usage += `--${optAndValue}${optAndValue.length < 14 ? '\t ' : ' '}`;
            usage += `${opt.description || ''}`;
        }
        return usage;
    }

    /**
     * Initialize self and parse args based 
     * on provided config and argv.
     */
    private evaluateArgs() {
        this.resetState();

        let collectingOptionFor: OptionsResult = null;
        let optCollectionDisabled: boolean = false;

        for (let arg of this.rawArgs) {
            let valuePart = null;

            assert(typeof arg === 'string', 'GetOpt argument is not a string.');

            if (collectingOptionFor) {
                if (collectingOptionFor.type === 'string') {
                    collectingOptionFor.value = arg;
                } else if (collectingOptionFor.type === 'array') {
                    collectingOptionFor.value.push(arg);
                }
                collectingOptionFor = null;
                continue;
            }


            if (optCollectionDisabled) {
                this.argumentsCollector.push(arg);
                continue;
            }

            // checking if equal sign is at least third char (e.g. -o=1)
            if (arg.indexOf('=') > 1) {
                [arg, valuePart] = arg.split('=');
            }
            if (arg.charAt(0) === '-') {
                if (arg.charAt(1) === '-') {
                    if (arg.length === 2) {
                        // found '--' special arg
                        optCollectionDisabled = true;
                        continue;
                    }
                    // is long arg
                    const matchingArg = this.config.options
                        .find(opt => opt.long === arg.slice(2));
                    if (!matchingArg) {
                        throw new UnknownOptionError(arg);
                    } else if (matchingArg.type === 'boolean') {
                        this.optionsCollector.push({
                            label: matchingArg.long,
                            type: 'boolean',
                            value: true
                        });
                    } else if (matchingArg.type === 'string') {
                        const newOpt: OptionsResult = {
                            label: matchingArg.long,
                            type: 'string',
                            value: null,
                        };
                        if (valuePart) {
                            newOpt.value = valuePart;
                        } else {
                            collectingOptionFor = newOpt;
                        }
                        this.optionsCollector.push(newOpt);
                    } else if (matchingArg.type === 'array') {
                        let opt = this.optionsCollector.find(o => o.label === matchingArg.long) as ArrayOptionResult;
                        if (!opt) {
                            opt = {
                                type: 'array',
                                label: matchingArg.long,
                                value: []
                            };
                            this.optionsCollector.push(opt);
                        }
                        if (valuePart) {
                            opt.value.push(valuePart);
                        } else {
                            collectingOptionFor = opt;
                        }
                    }
                } else {
                    // is short arg
                    let charCounter = 0;
                    for (let char of arg.slice(1)) {
                        charCounter += 1;
                        const matchingArg = this.config.options
                            .find(opt => opt.short === char);
                        if (!matchingArg) {
                            throw new UnknownShortOptionError(char, arg);
                        } else if (matchingArg.type === 'boolean') {
                            this.optionsCollector.push({
                                label: matchingArg.long,
                                type: 'boolean',
                                value: true
                            });
                        } else if (charCounter < arg.length - 1) {
                            // option demands value, but another short arg was provided
                            throw new MissingValueInShortArgs(char, arg);
                        } else if (matchingArg.type === 'string') {
                            const newOpt: OptionsResult = {
                                label: matchingArg.long,
                                type: 'string',
                                value: null,
                            };
                            if (valuePart) {
                                newOpt.value = valuePart;
                            } else {
                                collectingOptionFor = newOpt;
                            }
                            this.optionsCollector.push(newOpt);
                        } else if (matchingArg.type === 'array') {
                            let opt = this.optionsCollector.find(o => o.label === matchingArg.long) as ArrayOptionResult;
                            if (!opt) {
                                opt = {
                                    type: 'array',
                                    label: matchingArg.long,
                                    value: []
                                };
                                this.optionsCollector.push(opt);
                            }
                            if (valuePart) {
                                opt.value.push(valuePart);
                            } else {
                                collectingOptionFor = opt;
                            }
                        } else {
                            console.error('Unhandled char:', char, 'in chunk:', arg);
                        }
                    }
                }
                continue;
            }
            this.argumentsCollector.push(arg);
        }

        const notProvidedOptionsWithEnvAlias = this.config.options
            .filter(opt => 'envAlias' in opt && !this.options.find(o =>
                o.label === opt.long
            ));

        for (let opt of notProvidedOptionsWithEnvAlias) {
            if (opt.envAlias in this.processEnv) {
                let value: boolean | string | string[];
                switch (opt.type) {
                    case 'boolean':
                        value = true;
                        break;
                    case 'string':
                        value = this.processEnv[opt.envAlias];
                        break;
                    case 'array':
                        value = [this.processEnv[opt.envAlias]];
                        break;
                }

                this.optionsCollector.push({
                    label: opt.long,
                    type: opt.type,
                    value,
                } as OptionsResult);
            }
        }

        const notProvidedOptionsWithDefault = this.config.options
            .filter(opt => 'default' in opt && !this.options.find(o =>
                o.label === opt.long
            ));
        for (let opt of notProvidedOptionsWithDefault) {
            this.optionsCollector.push({
                label: opt.long,
                type: opt.type,
                value: opt.default,
            } as OptionsResult);
        }
    }

    /**
     * Initilize inner collectors.
     */
    private resetState() {
        this.argumentsCollector.splice(0, this.argumentsCollector.length);
        this.optionsCollector.splice(0, this.optionsCollector.length);
    }
}
