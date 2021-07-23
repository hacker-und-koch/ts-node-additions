import { RequestHandler } from '../request-handler';


export interface RouteOptions {
    path?: string;
    methods?: string[];
    handlers?: (typeof RequestHandler)[];
}
