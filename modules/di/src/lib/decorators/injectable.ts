import { getConstructorArgs } from "./util";
import { IInjectable } from "../bootstrapping/hooks/injectable";

export interface InjectableOptions {
    /**
     * If set this string will be used instead of 
     *  the actual class' name.
     */
    injectAs?: string;
    /**
     * All classes that are injected in any way 
     *  need to be listed here.
     * 
     * In order for a class to be accepted it has 
     *  to be decorated with`@Injectable` or something
     *  similar. 
     */
    declarations?: any[];
}

export function Injectable(options?: InjectableOptions) {
    options = options || {};

    return function (constructor: any) {

        constructor.__tna_di_decorated__ = true;
        constructor.__tna_di_provides__ = options.injectAs || constructor.name;
        constructor.__tna_di_consumes__ = getConstructorArgs(constructor);
        constructor.__tna_di_declarations__ = options.declarations;


        return constructor as IInjectable;
    } as (constr: any) => any;
}
