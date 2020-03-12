import { UrlWithParsedQuery } from "url";
import { IncomingMessage } from "http";

export interface Request<T> {
    body: (encoding?: string) => Promise<T>;
    parsedUrl: UrlWithParsedQuery;
    parameters: { [key: string]: string };
    id: string;
    _raw: IncomingMessage;
}
