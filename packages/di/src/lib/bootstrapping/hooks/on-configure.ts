import { IInjectable } from "./injectable";

export declare class OnConfigure extends IInjectable {
    __tna_di_configuration_key__?: {
        propertyKey: string;
        defaultConfiguration: any;
    };

    onConfigure(configuration: any): Promise<void>;
}
