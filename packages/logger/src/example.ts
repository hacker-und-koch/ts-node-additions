import { Logger, FormatFunction } from './index'
import { LoggerPackage } from './lib';

const formatFunction: FormatFunction = (pkg: LoggerPackage): Buffer | string => {
    const argsAsString = pkg.parts
        .map(arg => arg.toString())
        .join('+++');
    return `[${pkg.class}] ${argsAsString}\n`;
}

const logger: Logger = Logger.build()
    .className('MyClass')
    .format(formatFunction)
    .create();

logger.log('lorem', 'ipsum');
