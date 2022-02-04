import { Injectable, InjectConfiguration, Logger, OnConfigure } from '@hacker-und-koch/di';

import { request as httpRequest, IncomingMessage } from 'http';
import { request as httpsRequest, RequestOptions } from 'https';

import { URL } from 'url';


export type Resolver = (val: unknown) => unknown;
export type Rejecter = (val: unknown) => unknown;

export type PromisePair = [Resolver, Rejecter][];

export function request(href: string): CallResult;
export function request(options: HttpRequestOptions): CallResult;
export function request(href: string, options: HttpRequestOptions): CallResult;
export function request(href: string, options: HttpRequestOptions, body?: any): CallResult;
export function request(
    hrefOrOptions: string | HttpRequestOptions,
    options?: HttpRequestOptions,
    body?: any
): CallResult {
    return new HttpClient(Logger.build().className('tmp-request').create()).call(hrefOrOptions as string, options, body);
}

export class CallResult {
    private finalBody: Buffer;
    private awaitingBody: PromisePair = [];
    private innerBody: Promise<Buffer>;
    private handleResponse(res: IncomingMessage) {
        this.innerBody = new Promise<Buffer>((resolve, reject) => {
            const collector: Buffer[] = [];
            let error: Error = undefined;
            res.on('error', err => {
                error = err;
                reject(err);
            });
            res.on('data', d => collector.push(d));
            res.on('end', () => {
                if (error) {
                    return;
                }
                const body = Buffer.concat(collector);
                this.finalBody = body;
                resolve(body);
            });
        });
        this.innerBody
            .then(body => {
                this.awaitingBody.forEach((pair => pair[0](body)));
            })
            .catch(err => {
                this.awaitingBody.forEach((pair => pair[1](err)));
            });
    }

    private fail(error: Error) {

    }

    get body(): Promise<any> {
        if (this.finalBody) {
            return Promise.resolve(this.finalBody);
        }
        const tmpPromise = new Promise((resolve, reject) => {
            if (this.innerBody) {
                this.innerBody
                    .then(resolve)
                    .catch(reject);
                return;
            }
            this.awaitingBody.push([resolve, reject]);
        });
        return tmpPromise;
    }
}

export interface HttpRequestOptions extends RequestOptions {

}

export interface HttpClientConfiguration extends HttpRequestOptions {

    /**
     * Will be parsed with URL lib to 
     * evaluate path. Can also be used to 
     * define complex requests in one string.
     * 
     * 
     * _Examples:_ 
     * * `https://example.com/api`
     * * `http://localhost:8080/foo/bar?query=true`
     */
    baseUrl?: string;
    defaultMethod?: string;

}

@Injectable()
export class HttpClient implements OnConfigure {
    @InjectConfiguration()
    private config: HttpClientConfiguration;

    constructor(private logger: Logger) {

    }

    /**
     * Can be used to call any HTTP endpoint. Check https://nodejs.org/api/url.html 
     */
    call(): CallResult;
    call(href: string): CallResult;
    call(options: HttpRequestOptions): CallResult;
    call(href: string, options: HttpRequestOptions): CallResult;
    call(href: string, options: HttpRequestOptions, body?: any): CallResult;
    call(
        hrefOrOptions?: string | HttpRequestOptions,
        options?: HttpRequestOptions,
        body?: any,
    ): CallResult {
        if (typeof hrefOrOptions === 'string') {
            options = new URL((this.config?.baseUrl, hrefOrOptions));
        }
        if (typeof body === 'object' && !Buffer.isBuffer(body)) {
            try {
                body = JSON.stringify(body);
                options.headers['Content-Type'] = 'application/json'
            } catch (err) {
                console.error(err);
                throw new Error('Failed to stringify non-Buffer body.');
            }
        }


        options = {
            ...this.config,
            ...options
        };

        let reqFunction: typeof httpRequest | typeof httpsRequest;
        switch (options.protocol) {
            case undefined:
            case 'http://':
                reqFunction = httpRequest;
                break;
            case 'https://':
                reqFunction = httpsRequest;
                break;
            default:
                throw new Error('');
        }
        const result = new CallResult();
        try {
            this.logger.log(options);
            const req = reqFunction({
                ...options
            }, res => result['handleResponse'](res));
            if (body) {
                body = typeof body === 'string' ? Buffer.from(body) : body;
                req.setHeader('Content-Length', body.byteLength);
                req.write(body);
            }
        } catch (err) {
            result['fail'](err);
        }

        // result.handleResponse();
        return result;
    }

    onConfigure() {
        this.logger.info(this.config);
    }

}
