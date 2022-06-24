import { GetOptConfiguration } from '@hacker-und-koch/getopt';
import { Logger, Loglevel } from '@hacker-und-koch/logger';

import { Providers } from './providers';

export interface BootstrapOptions {
    log?: Loglevel | { [className: string]: Loglevel };
    getoptOptions?: GetOptConfiguration[];
    providers?: Providers;
}

export async function bootstrap(target: any): Promise<Providers>;
export async function bootstrap(target: any, options: BootstrapOptions): Promise<Providers>;
export async function bootstrap(target: any, options?: BootstrapOptions): Promise<Providers> {
    options = options || { log: 'spam' };

    const formatedLogLevelOption = Providers.formatLogLevels(options.log);
    const di_logger: Logger = Logger.build()
        .className('bootstrap')
        .level(Providers.logLevelIn('bootstrap', formatedLogLevelOption))
        .create();

    di_logger.info(`Target: ${target.name}`);

    if (options.providers && !(options.providers instanceof Providers)) {
        throw new Error(`'providers' option is not an instance of Providers!`);
    }

    if (options.providers) {
        di_logger.info(`Reusing Providers.`);
    }

    const providers = options.providers || new Providers({
        loglevels: formatedLogLevelOption
    });

    providers.createGetOpt({
        ...(target.__tna_di_options__ || {})
    });

    providers.setupShutdownHook();

    providers.register(target, 'bootstrap');

    try {
        providers.gimme<typeof target>(target, 'bootstrap');
    } catch (e) {
        di_logger.error(e.message);
        di_logger.info(e);
        process.exit(1);
    }

    providers.announceInstanceCreation();

    await providers.configureInstances()
        .then(_ => providers.initInstances())
        .then(_ => providers.announceReady());
    di_logger.info(`Done bootstraping ${target.name}.`);

    return providers;
}
