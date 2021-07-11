import { OptionType } from './option-type';

export type OptionsResult = BooleanOptionResult |
    StringOptionResult |
    ArrayOptionResult;

export interface GenericOptionResult {
    type: OptionType;
}

export interface BooleanOptionResult extends GenericOptionResult {
    type: 'boolean';
    value: boolean;
    label: string;
}

export interface StringOptionResult extends GenericOptionResult {
    type: 'string';
    value: string;
    label: string;
}

export interface ArrayOptionResult extends GenericOptionResult {
    type: 'array';
    value: string[];
    label: string;
}
