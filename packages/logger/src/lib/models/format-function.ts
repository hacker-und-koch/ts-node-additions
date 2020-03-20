import { LoggerPackage } from "./logger-package";

export type FormatFunction = (loggerPackage: LoggerPackage) => string | Buffer;
