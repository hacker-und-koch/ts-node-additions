import { Injectable } from '@hacker-und-koch/di';
import { RouteOptions } from '../models';
import { RequestHandler } from '../request-handler';
import { HTTP_ROUTE_OPTIONS } from '../symbols';

export interface RouteDecorated {
    [HTTP_ROUTE_OPTIONS]: RouteOptions;
}

export function Route(routeOptions?: RouteOptions) {

    return function (target: (typeof RequestHandler) & any) {
    
        Injectable()(target);

        target[HTTP_ROUTE_OPTIONS] = routeOptions
        return target;
    }
}
