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
    ) {
        if (!this.config.positionalArgs) {
            this.config.positionalArgs = [];
        }
        this.evaluateArgs();
    }

    private argumentsCollector: string[] = [];
    private optionsCollector: OptionsResult[] = [];

    public get $0(): string {
        return this.argv[0];
    }

    public get $1(): string {
        return this.argv[1];
    }

    public get rawArgs(): string[] {
        console.log(this.argv);
        return this.argv.slice(2);
    }

    public get result() {
        return {
            $0: this.$0,
            $1: this.$1,
            args: this.arguments,
            opts: this.options,
        };
    }

    public get arguments(): string[] {
        return this.argumentsCollector.slice();
    }

    public get options(): OptionsResult[] {
        // deep copy collector for safety reasons
        return this.optionsCollector
            .map(opt => ({ ...opt }));
    }

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
        },  '');
        let usage = `Usage: ${appName}${optionsPart}${argPart}`;
        for (let opt of this.config.options) {
            usage += `\n`;
            usage += `${opt.short ? '-' + opt.short + ', ' : '    '}`;
            let optAndValue = opt.long;
            if (opt.type !== 'boolean') {
                optAndValue += ` <${opt.valueName || 'value'}>`;
            }
            usage += `--${optAndValue}${optAndValue.length < 14 ? '\t ' : ' '}`;
        }
        return usage;
    }


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
                            console.log('unhandled char:', char, 'in chunk:', arg);
                        }
                    }
                }
                continue;
            }
            this.argumentsCollector.push(arg);
        }
    }

    private resetState() {
        this.argumentsCollector.splice(0, this.argumentsCollector.length);
        this.optionsCollector.splice(0, this.optionsCollector.length);
    }
}

    
