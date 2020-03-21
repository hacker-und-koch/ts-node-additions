import { Logger } from './index'

const logger: Logger = Logger.build()
    .className('main')
    .level('spam')
    .create();

logger.spam('first');

logger.info('supporting', { 'node-style': "JSON", "pr": 1, "nting": ["!"] });

logger.log('Hi, planet!');

logger.warn('There will be an error now');

logger.error(new Error('Actually not that bad.'));
