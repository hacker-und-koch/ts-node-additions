import { disconnect } from 'process';
import {
    INTERNAL_TYPE_KEY,
    INTERNAL_NAME_KEY,
} from './decorators';

interface FaultyKey {
    key: string;
    has: any;
    wants: any;
}

interface CheckResult {
    isValid: boolean;
    faultyKeys?: FaultyKey[];
}

interface InnerStore {
    [name: string]: {
        type: any, mandatory?: boolean
    }
}

export class TypeStore {
    private store: InnerStore = {};

    add(dataType: any) {
        this.store[dataType[INTERNAL_NAME_KEY]] = dataType[INTERNAL_TYPE_KEY];
        console.log(this.store);
    }

    check(input: any, dataType: any): CheckResult {
        const failures: FaultyKey[] = [];
        const didEvaluate: string[] = [];
        for (let key in dataType[INTERNAL_TYPE_KEY]) {
            const inputVal = input[key];
            const has = typeof inputVal;
            const info = dataType[INTERNAL_TYPE_KEY][key];
            const wants = info.type.name?.toLowerCase();
            //            console.log(inputVal, has, wants);
            if (inputVal === undefined) {
                if (info.mandatory) {
                    failures.push({
                        key, wants, has
                    });
                }
            } else if (!(wants in ['object', 'function'])) {
                if (has !== wants) {
                    failures.push({
                        key, wants, has
                    })
                }
            } else {
                // dunno yet :|
                // somehow gotta do recursive stuffs
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
