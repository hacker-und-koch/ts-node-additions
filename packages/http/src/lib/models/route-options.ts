import { RequestHandler } from '../request-handler';


export interface RouteOptions {
    path?: string;
    methods?: string[];
    handlers?: (typeof RequestHandler)[];
    setHeaders?: { [key: string]: string };
    /**
     * If set an incoming path '/foo/bar' will
     * not be evaluated by an RequestHandler that
     * is configured to handle '/foo'. If not the
     * handle function will be called even if 
     * there are no relevant child handlers present.
     */
    matchExact?: boolean;
}
