import { readFileSync } from 'fs';
import { resolve as resolvePath, parse as parsePath } from 'path';

import { SourceMapReader } from './source-map-reader';

const mappingUrlReference = '//# sourceMappingURL=';
const NodeError = Error;

export class ErrorParser {
    private sourceCache: { [jsFile: string]: SourceMapReader } = {};
    modifyStack(error: Error): Error {
        error.stack = error.stack.split('\n').map(line => {
            const origin = /    at [^ ]+/.exec(line);
            if (!origin) {
                return line;
            }

            const modifyFromPosition = String(origin).length;
            const keepAsIsPart = line.substring(0, modifyFromPosition);
            const result = /\((\/[^/]+)+\/[^/]+\.js:[0-9]+:[0-9]+\)$/.exec(line);
            if (!result) {
                return line;
            }

            const [codeFile, codeLine, codeColumn] = line.slice(result.index + 1, line.length - 1).split(':');

            if (!this.sourceCache[codeFile]) {
                const mapRef = readFileSync(codeFile).toString('utf-8')
                    .split('\n')
                    .find(line => line.indexOf(mappingUrlReference) === 0);
                if (!mapRef) {
                    return line;
                }
                const mapFile = mapRef.slice(mappingUrlReference.length);
                const fullPath = resolvePath(parsePath(codeFile).dir, mapFile);
                this.sourceCache[codeFile] = new SourceMapReader(fullPath);
            }
            const reader = this.sourceCache[codeFile];
            try {
                return reader.map(BigInt(codeLine) - 1n, BigInt(codeColumn) - 1n, keepAsIsPart);
            } catch (e) {
                console.error('Failed to map sourcemaps:', e);
                return line;
            }

        }).join('\r\n');

        return error;
    }

    static registerErrorHandling() {
        const parser = new ErrorParser();
        process.on('uncaughtException', (error) => {
            error = parser.modifyStack(error);
            console.error(error);
            process.exit(1);
        });
    }

    static monkeyPatchGlobalError() {
        const parser = new ErrorParser();
        class Error extends NodeError {
            constructor(public message: string) {
                super(message);
                this.stack = parser.modifyStack(this).stack;
            }
        }

        if (global.Error === NodeError) {
            global.Error = Error as any;
        }
    }
}
