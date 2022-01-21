import { Logger } from '@hacker-und-koch/logger';
import { randomBytes } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import { URL, URLSearchParams } from 'url';
import { BodySizeExceededError, HttpError, InvalidRequestError } from './errors';

export declare type ErrorCallback = (error?: HttpError) => any;

export class RequestContext {
    constructor(
        private _req: IncomingMessage,
        private _res: ServerResponse,
        private logger: Logger,
        private _id: string = randomBytes(8).toString('hex'),
    ) {
        this._url = new URL(_req.url, 'http://' + (_req.socket.localAddress as string || _req.headers['x-forwarded-for'] as string || 'localhost'));
        this._pathLeftToEvaluate = this._url.pathname;
        this.logger['id'] = this._id;
    }

    public static MAX_BODY_SIZE = 0xfffff;

    private _url: URL = undefined;

    private _finalBuffer: Buffer = undefined;
    private _collectingBuffer: boolean = false;
    private _bufferQueue: [((buffer: Buffer) => void), ((error: Error) => void)][] = [];

    private _evaluatedPath: string = '';

    private _error: HttpError = undefined;
    private _statusCode: number = -1;
    private _errorCallbacks: ErrorCallback[] = [];

    private _pathVariables: Map<string, string> = new Map<string, string>();
    private _pathLeftToEvaluate: string = undefined;

    get id(): string {
        return this._id;
    }

    get url(): URL {
        return this._url;
    }

    get originalUrl(): string {
        return this._req.url;
    }
    get method(): string {
        return this._req.method;
    }

    get search(): URLSearchParams {
        return this._url.searchParams;
    }

    get evaluatedPath(): string {
        return this._evaluatedPath || '';
    }

    get error(): HttpError {
        return this._error;
    }

    get pathVariables(): Map<string, string> {
        return new Map(this._pathVariables);
    }

    get pathToEvaluate() {
        return this._pathLeftToEvaluate;
    }

    set error(error: HttpError) {
        if (this._error) {
            // todo: figure out how to ensure that they are visible
            return;
        }
        this._res.statusCode = error.statusCode;
        this._res.end();
        this._errorCallbacks.forEach(fn => fn(error));
        this._error = error;
    }

    set status(code: number) {
        if (this._statusCode > -1) {
            throw new HttpError(`Tried to set context status to ${code} although it was already set to ${this._statusCode}`);
        }
        this._res.statusCode = code;
        this._statusCode = code;
    }

    get rawBody(): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            let detectedError: Error = null;
            // if buffer is known
            if (this._finalBuffer) {
                resolve(this._finalBuffer);
            } else if (this._collectingBuffer) {
                this._bufferQueue.push([resolve, reject]);
            } else {
                this._collectingBuffer = true;
                const chunks: Buffer[] = [];
                let collectedChunksSize = BigInt(0);

                this._req.on('data', (data: Buffer) => {
                    this.logger.spam(`Received ${data.byteLength} bytes of data`);
                    collectedChunksSize += BigInt(data.byteLength);
                    if (collectedChunksSize < RequestContext.MAX_BODY_SIZE) {
                        chunks.push(data);
                    } else {
                        const error = new BodySizeExceededError();
                        reject(error);
                        detectedError = error;
                    }
                });

                this._req.on('end', () => {
                    this.logger.spam(`End of data`);

                    if (detectedError) {
                        for (let group of this._bufferQueue) {
                            group[1](detectedError);
                        }
                        return;
                    }
                    this._finalBuffer = Buffer.concat(chunks);
                    for (let group of this._bufferQueue) {
                        group[0](this._finalBuffer);
                    }
                    resolve(this._finalBuffer);
                });
            }
        });
    }

    get jsonBody(): Promise<any> {
        return this.rawBody
            .then(body => {
                try {
                    return JSON.parse(body.toString('utf-8'));
                } catch (err) {
                    this.logger.spam(`Failed to parse body: '${body}'`);
                    throw new InvalidRequestError('Failed to parse body as JSON');
                }
            });
    }

    get hasSearch(): boolean {
        return [...this._url.searchParams.keys()].length > 0;
    }

    get original() {
        return {
            req: this._req,
            res: this._res,
        }
    }

    addErrorCallback(cb: ErrorCallback) {
        if (this._error) {
            cb(this._error);
            return;
        } else {
            this._errorCallbacks.push(cb);
        }
    }

    announcePathSegmentAsEvaluated(handlerPath: string) {
        if (handlerPath === undefined) {
            throw new Error('Detected announcement of undefined handlerPath');
        }
        for (let key of this._pathVariables.keys()) {
            handlerPath = handlerPath.replace(RegExp(`\{${key}\}`), this._pathVariables.get(key));
        }
        if (this._pathLeftToEvaluate.indexOf(handlerPath) !== 0) {
            throw new Error(`handlerPath (${handlerPath}) does not match pathLeftToEvaluate(${this._pathLeftToEvaluate})`);
        }

        this._pathLeftToEvaluate = this._pathLeftToEvaluate.substr(handlerPath.length);
        this._evaluatedPath += handlerPath;
    }

    announcePathVariables(vars: Map<string, string>) {
        for (let key of vars.keys()) {
            if (this._pathVariables.has(key)) {
                throw new Error('Trying to announce existing path variable.')
            }
            this._pathVariables.set(key, vars.get(key));
        }
    }

    setHeader(name: string, value: string) {
        this._res.setHeader(name, value);
    }
}
