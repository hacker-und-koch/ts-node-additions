
import { Router } from './router';


export interface OASInfo {
    title: string;
    description: string;
    version: string;
}

export class RouteTree {
    constructor(private router: Router) {

    }

    oas(options?: OASInfo): any {
        return {
            openapi: '3.0.0',
            info: {
                ...options,
            },
            servers: [{
                url: `http://${this.router.url}`,
            }],
            paths: this.router
        }
    }

    toString() {
        return 'Lelz';
    }
}
