import { Configuration } from './configuration';

export declare class ConfigurationProvider {
    onProvideConfigurations(): Promise<Configuration<any>[]>;
} 
