import { readFileSync } from 'fs';
import { resolve as resolvePath, join as joinPath, parse as parsePath, ParsedPath } from 'path';

import { SourceMapReader } from './source-map-reader';

const mappingUrlReference = '//# sourceMappingURL=';

export class ErrorParser {
    private sourceCache: { [jsFile: string]: SourceMapReader } = {};
    map(error: Error): Error {
        error.stack = error.stack.split('\n').map(line => {
            if (line.indexOf("    at ") !== 0) {
                return line;
            }

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
            return reader.map(BigInt(codeLine) - 1n, BigInt(codeColumn) - 1n);

        }).join('\r\n');

        return error;
    }

    static registerErrorHandling() {
        const parser = new ErrorParser();
        process.on('uncaughtException', (error) => {
            error = parser.map(error);
            console.error(error);
            process.exit(1);
        });
    }
}
