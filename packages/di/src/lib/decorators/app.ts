import { Injectable, InjectableOptions } from "./injectable";
import { Configuration } from "../bootstrapping/configurations";
import { GetOptConfiguration } from "@hacker-und-koch/getopt";

export interface AppOptions extends InjectableOptions {
  /**
     * Configurations to be handed to the instances.
     */
    configs?: Configuration<any>[];
    /**
     * Runtime options for GetOpt.
     */
    getopt?: GetOptConfiguration;
    /**
     * Disable getopt's help-trap.
     * 
     * Set to `true` to disable printing of 
     *  a generated help text. By default
     *  the process will exit before bootstrapping
     *  if run with `-h` or `--help`.
     * Default: `false`
     */
    noHelp?: boolean;
}

export function Application(options?: AppOptions) {
    options = Object.assign({
        declarations: [],
        configs: [],
        options: [],
        noHelp: false
    } as AppOptions, options);

    return function (constructor: any) {
        Injectable(options)(constructor);

        constructor.__tna_di_configs__ = options.configs;
        constructor.__tna_di_options__ = options.getopt;
        constructor.__tna_di_help_trap__ = !options.noHelp;

    }
}
