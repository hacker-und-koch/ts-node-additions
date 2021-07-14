import { Injectable, Inject } from "@hacker-und-koch/di";
import { Response, Request } from "./models";
import { RequestHandler } from "./request-handler";

@Injectable()
export class Default404Route {
    async handle(req: Request, res: Response): Promise<void> {
        res.status(404);
    }
}
