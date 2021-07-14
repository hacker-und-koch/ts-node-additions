import { RequestHandler } from '../request-handler';


export interface RouteOptions {
    path?: string;
    methods?: string[];
    children?: any[];
}
