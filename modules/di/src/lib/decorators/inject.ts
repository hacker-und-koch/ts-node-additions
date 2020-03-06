export function Inject(type: any, id: string) {
    return function (target: any, paramKey: string) {
        if (!target.__tna_di_inject_with_id__) {
            target.__tna_di_inject_with_id__ = [];
        }

        let usedid = id;
        if (/^<<.+>>$/.test(id)) {
            usedid = id.substring(2, id.length - 2) + "-" + Buffer.from((Math.random() * Date.now()).toFixed(0)).toString("base64").substr(2, 6);
        }

        if (usedid !== id) {
            target.__tna_di_config_id_map__ = Object.assign(
                target.__tna_di_config_id_map__ || {},
                { [id]: usedid }
            )
        }

        target.__tna_di_inject_with_id__.push({
            paramKey,
            type,
            id: usedid
        });
    }
}