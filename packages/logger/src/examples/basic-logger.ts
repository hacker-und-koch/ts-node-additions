import { Logger, LoggerBuilder } from '../index'

const loggerBuilder: LoggerBuilder = Logger.build();

loggerBuilder.className('MyClass');  // manditory
// loggerBuilder.level('log');  // uncomment to set 'log' as new threshold

const logger: Logger = loggerBuilder.create();

logger.spam('lorem');
logger.info('ipsum');
logger.log('dolor');
logger.warn('sit');
logger.error('amet');
