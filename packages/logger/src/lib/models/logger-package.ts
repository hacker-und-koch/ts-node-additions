import { Loglevel } from "./loglevel";

export interface LoggerPackage {
    level: Loglevel;
    class: string;
    id: string;
    parts: any[];
    formatedParts?: string;
    time: number;
}
