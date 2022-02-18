
export function Get(target: any, propertyKey: string): void {
    target.__tna_http_method_handlers__ = {
        ...target.__tna_http_method_handlers__ ,
        GET: propertyKey,
    }
}

export function Post(target: any, propertyKey: string): void {
    target.__tna_http_method_handlers__ = {
        ...target.__tna_http_method_handlers__ ,
        POST: propertyKey,
    }
}

export function Put(target: any, propertyKey: string): void {
    target.__tna_http_method_handlers__ = {
        ...target.__tna_http_method_handlers__ ,
        PUT: propertyKey,
    }
}

export function Delete(target: any, propertyKey: string): void {
    target.__tna_http_method_handlers__ = {
        ...target.__tna_http_method_handlers__ ,
        DELETE: propertyKey,
    }
}

export function Handle(target: any, propertyKey: string): void {
    target.__tna_http_method_handlers__ = {
        ...target.__tna_http_method_handlers__ ,
        ANY: propertyKey,
    }
}
