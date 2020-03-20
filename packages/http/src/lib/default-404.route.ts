import { Injectable, Inject } from "@tna/di";
import { Response, Request } from "./models";
import { RequestHandler } from "./request-handler";

@Injectable()
export class Default404Route {
    async handle(req: Request<void>, res: Response): Promise<void> {
        res.status(404);
    }
}
