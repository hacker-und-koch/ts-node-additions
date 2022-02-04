import { Injectable } from "@hacker-und-koch/di";
import { NotFoundError } from './errors/not-found-error';
import { RequestContext } from './request-context';

@Injectable()
export class Default404Route {
    async handle(context: RequestContext): Promise<void> {
        throw new NotFoundError();
    }
}
