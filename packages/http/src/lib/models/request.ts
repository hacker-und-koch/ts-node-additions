import { URL } from "url";
import { IncomingMessage } from "http";

export interface Request {
    body: (encoding?: string) => Promise<any>;
    parsedUrl: URL;
    parameters: { [key: string]: string };
    id: string;
    _raw: IncomingMessage;
}
