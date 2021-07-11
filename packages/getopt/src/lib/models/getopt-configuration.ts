export interface PositionalArgInfo {
    name: string;
    maniditory?: boolean;
    multi?: boolean;
}

export interface GetOptConfiguration {
    /** Used to parse runtime options. */
    options: GetOptOption[];
    /** Used to display automated usage. Cosmetics only! */
    positionalArgs?: PositionalArgInfo[] | ((providedArgs: string[])=> PositionalArgInfo[]);
    /** Name printed in usage. */
    appName?: string;
    /** If provided: Do not add help option and hook. */
    noAutoHelp?: boolean;
    /** If provided: Call this function instead of console.log and process.exit. */
    onPrintUsage?: (text?: string) => any;
}

export interface GetOptOption {
    /** 
     * Determines parser behaviour and resulting value 
     * type for this option. 
     */
    type: 'boolean' | 'string' | 'array';
    /** Long option for commandline and identifier. */
    long: string;
    /** Short option for command line (! Provide single char !) */
    short?: string;
    /** 
     * If provided: Parser will try to fetch a value from 
     * a variable in process environment with the provided 
     * name
     */
    envAlias?: string;
    /** Cosmetic display for usage text. */
    valueName?: string;
    /** Description in usage text. */
    description?: string;
    /** 
     * If provided: Will assign the provided value
     * to an option if parser is unable to find it 
     * elsewhere.
     */
    default?: string | string[];
}
