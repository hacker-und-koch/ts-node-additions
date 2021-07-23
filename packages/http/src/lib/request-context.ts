import { IncomingMessage, Server, ServerResponse } from 'http';
import { URL, URLSearchParams } from 'url';
import { BodySizeExceededError } from './errors/body-size-exceeded-error';


export class RequestContext {
    constructor(
        private _req: IncomingMessage,
        private _res: ServerResponse
    ) {
        this._url = new URL(_req.url, (_req.socket.localAddress as string || _req.headers['x-forwarded-for'] as string || 'http://localhost'));
    }

    public static MAX_BODY_SIZE = 0xfffff;

    private _url: URL = void 0;

    private _finalBuffer: Buffer = void 0;
    private _collectingBuffer = false;
    private _bufferQueue: [((buffer: Buffer) => void), ((error: Error) => void)][] = [];

    get originalUrl(): string {
        return this._req.url;
    }
    get method(): string {
        return this._req.method;
    }

    get search(): URLSearchParams {
        return this._url.searchParams;
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

    get hasSearch(): boolean {
        return [...this._url.searchParams.keys()].length > 0;
    }

    get original() {
        return {
            req: this._req,
            res: this._res,
        }
    }
}
