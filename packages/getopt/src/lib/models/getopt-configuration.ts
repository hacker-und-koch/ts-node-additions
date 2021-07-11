export interface PositionalArgInfo {
    name: string;
    maniditory?: boolean;
    multi?: boolean;
}

export interface GetOptConfiguration {
    options: GetOptOption[];
    positionalArgs?: PositionalArgInfo[] | ((providedArgs: string[])=> PositionalArgInfo[]);
    appName?: string;
}

export interface GetOptOption {
    type: 'boolean' | 'string' | 'array';
    long: string;
    short?: string;
    valueName?: string;
    envAlias?: string;
    description?: string;
    required?: boolean;
    default?: boolean | string | string[];
}
