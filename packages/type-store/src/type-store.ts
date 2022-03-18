import {
    INTERNAL_TYPE_KEY,
    INTERNAL_NAME_KEY,
} from './decorators';

export interface FaultyKey {
    key: string;
    has: any;
    wants: any;
}

export interface CheckResult {
    isValid: boolean;
    faultyKeys?: FaultyKey[];
}

interface InnerStore {
    [name: string]: {
        [INTERNAL_TYPE_KEY]: {
            [key: string]: {
                type: any;
                mandatory?: boolean;
            }
        }
    }
}

const BUILTINS = ['string', 'number', 'bigint', 'boolean', 'symbol', 'undefined', 'object', 'function'];

function isBuiltInType(type: string) {
    return BUILTINS.indexOf(type) > -1;
}

export class TypeStore {
    private store: InnerStore = {};

    get storage() {
        return this.store;
    }

    add(dataType: any) {
        this.store[dataType[INTERNAL_NAME_KEY]] = dataType;
        const addition = dataType[INTERNAL_TYPE_KEY];
        for (let key in addition) {
            // console.log(key, addition);
            if (isBuiltInType(addition[key].type.name.toLowerCase())) continue;

            addition[key] = {
                $ref: addition[key].type.name,
                raw: dataType,
            };
        }
        // console.log('>> STORE >>', this.store);
    }

    get schemas() {
        const out: any = {};
        for (let name in this.store) {
            out[name] = {
                type: 'object',
                properties: {} as any,
            }

            for (let key in this.store[name][INTERNAL_TYPE_KEY]) {
                const prop = this.store[name][INTERNAL_TYPE_KEY][key];
                if ("$ref" in prop) {
                    out[name].properties[key] = {
                        $ref: `#/components/schemas/${(prop as any).$ref}`
                    }
                    continue;
                }
                // console.log('?????', prop);
                const storeType = prop.type.name.toLowerCase();
                out[name].properties[key] = {
                    type: (storeType === 'bigint') ? 'integer' : storeType,
                }
            }
        }
        return out;
    }

    check(input: any, dataType: any, subOf?: string): CheckResult {
        const failures: FaultyKey[] = [];
        const didEvaluate: string[] = [];

        for (let key in dataType[INTERNAL_TYPE_KEY]) {
            const inputVal = input[key];
            const has = typeof inputVal;

            const info = dataType[INTERNAL_TYPE_KEY][key];
            if (info.$ref) {
                const ref = this.store[info.$ref];
                if (!inputVal) {
                    failures.push({
                        key: `${subOf ? subOf + '.' : ''}${key}`,
                        has,
                        wants: info.$ref,
                    })
                    continue;
                }
                const result = this.check(inputVal, ref, `${subOf ? subOf + '/' : ''}${key}`);
                if (!result.isValid) {
                    for (let fail of result.faultyKeys) {
                        failures.push(fail);
                    }
                }
                didEvaluate.push(key);
                continue;
            }

            const wants = info.type.name?.toLowerCase();

            if (inputVal === undefined) {
                if (info.mandatory) {
                    failures.push({
                        key: `${subOf ? subOf + '.' : ''}${key}`,
                        has,
                        wants,
                    });
                }
            } else if (['object', 'function'].indexOf(wants) < 0) {
                if (has !== wants) {
                    failures.push({
                        key: `${subOf ? subOf + '.' : ''}${key}`,
                        wants,
                        has,
                    })
                }
            } else {
                console.log('can i has?!');
            }
            didEvaluate.push(key);

        }

        for (let key in input) {
            if (didEvaluate.indexOf(key) > -1) continue;

            failures.push({
                key,
                // should better handle object/function keys
                has: typeof input[key],
                wants: 'undefined',
            });
        }
        return {
            isValid: !failures.length,
            faultyKeys: failures.length ? failures : undefined,
        }
    }
}
