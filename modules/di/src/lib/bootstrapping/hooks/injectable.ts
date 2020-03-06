import { Configuration } from "../configurations";
import { GetOptOption } from "@tna/getopt";

export declare class IInjectable {
    __tna_di_provides__?: string;
    __tna_di_consumes__?: string[];
    __tna_di_decorated__?: boolean;
    __tna_di_declarations__?: any[];
    
    __tna_di_getopt_options__?: {
        getOptKey: string;
        target: string;
    }[];
    
    __tna_di_getopt_arguments__?: {
        getOptKey: string;
        target: string;
    }[];
    
    __tna_di_config_id_map__?: {
        [key: string]: string;
    }
}

export declare class IApplication extends IInjectable {
    __tna_di_configs__?: Configuration<any>[];
    __tna_di_options__?: GetOptOption[];
    __tna_di_help_trap__?: boolean;
}
