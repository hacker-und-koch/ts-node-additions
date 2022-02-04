import { Injectable } from '@hacker-und-koch/di';
import { RouteOptions } from '../models';
import { RequestHandler } from '../request-handler';

export interface RouteDecorated {
    __tna_http_route_options__: RouteOptions;
}

export function Route(routeOptions?: RouteOptions) {

    return function (target: (typeof RequestHandler) & any) {
    
        Injectable()(target);

        (target as any).__tna_http_route_options__ = routeOptions
        return target;
    }
}
