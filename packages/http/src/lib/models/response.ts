import { ServerResponse } from "http";

export interface Response {
    status(code: number): Response;
    headers(headers: {[key: string]: string}): Response;
    _raw: ServerResponse;
}
