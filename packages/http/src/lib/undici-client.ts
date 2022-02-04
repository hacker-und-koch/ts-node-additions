import { Injectable, InjectConfiguration, Logger } from '@hacker-und-koch/di';
import { request, Dispatcher } from 'undici';
import { URL } from 'url';

/** mostly copied from undici types api.d.ts */
export type RequestOptions = { dispatcher?: Dispatcher } & Omit<(Dispatcher.RequestOptions), 'origin' | 'path'>;
export type UrlLike = string | URL;

export interface UndiciClientOptions {
    url: UrlLike;
    options?: RequestOptions;
}

export type UndiciResponse = Dispatcher.ResponseData;

/**
 * Wrapper for undici request. Purpose of 
 * the wrapper is to configure repeating 
 * requests on application start. Arguments
 * to `request` will always(!) be merged with
 * function with the provided globally provided 
 * config. This applies to `url` as well as
 * `options`.
 */
@Injectable()
export class UndiciClient {

    @InjectConfiguration<UndiciClientOptions>()
    private config: UndiciClientOptions;

    private _url: URL;

    get url(): URL {
        return this._url;
    }

    constructor(private logger: Logger) {

    }

    onConfigure() {
        this.logger.info(this.config);
        if (this.config.url instanceof URL) {
            this._url = this.config.url;
        } else {
            this._url = new URL(this.config.url);
        }
        if (this._url.pathname !== '/') {
            this.logger.warn('Detected path in configured url. ' +
                'This may likely be overwritten when resolving pathes. Check out Node\'s ' +
                'URL documentation for more information.'
            );
        }
    }

    public async request(url?: UrlLike, options?: RequestOptions): Promise<UndiciResponse> {
        const reqUrl = mergeUrlLike(this.url, url);
        this.logger.spam('Will call URL:', reqUrl.href);
        const reqOptions = mergeOptions(this.config.options, options);
        return this.performInternalRequest(reqUrl, reqOptions);
    }

    public async performInternalRequest(url: URL, options?: RequestOptions): Promise<Dispatcher.ResponseData> {
        return request(url, options);
    }
}

/** Merging URLs will naively follow node's logic
 * https://nodejs.org/docs/latest-v16.x/api/url.html#new-urlinput-base
 */
export function mergeURL(configured: URL, overwrite: URL): URL {
    return new URL(overwrite.href, configured);
}

export function mergeUrlLike(configured: UrlLike, overwrite: UrlLike): URL {

    if (configured instanceof URL && overwrite instanceof URL) {
        return mergeURL(configured, overwrite);
    }
    if (typeof overwrite === 'string') {
        return new URL(overwrite, configured);
    }
}

export function mergeOptions(configured: RequestOptions, overwrite: RequestOptions): RequestOptions {
    // too naive?
    const out = {
        ...configured,
        ...overwrite,
    };
    
    // either fix headers or create security nightmare 
    out.headers = {
        ...configured?.headers,
        ...overwrite?.headers
    }
    return out;
}



export function ensureURL(unsure: UrlLike): URL {
    if (unsure === '') {
        unsure = '/';
    }
    if (typeof unsure === 'string') {
        if (unsure.indexOf('/') === 0) {
            unsure = `localhost${unsure}`;
        }
        if (unsure.indexOf(':') < 1) {
            unsure = `https://${unsure}`;
        }
        return new URL(unsure);
    }
    if (unsure instanceof URL) {
        return unsure;
    }
}
