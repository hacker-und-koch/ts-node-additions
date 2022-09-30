/**
 * Shout out to Lachlan Miller!
 *  (https://lachlan-miller.me/articles/decoding-variable-length-quantity-vlq-for-source-maps)
 */

import { SourceMap } from './models';
import { resolve as resolvePath, join as joinPath, parse as parsePath, ParsedPath } from 'path';
import { readFileSync, existsSync } from 'fs';
import { ok } from 'assert';

// const CWD = process.cwd();
// const HOME = process.env.HOME;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const IDX_MAP = [
    "codeColumn",
    "sourceFileIdx",
    "sourceLine",
    "sourceColumn",
    "sourceName",
    "symbolRef"
];

interface Mapping {
    codeColumn: bigint;
    sourceFileIdx?: bigint;
    sourceLine?: bigint;
    sourceColumn?: bigint;
    sourceName?: bigint;
    orig?: string;
    symbolRef?: bigint;
}

declare type DecodedNumbers = bigint[];

export class SourceMapReader {
    private sourceMap: SourceMap;
    private mappings: Mapping[][] = [];
    private codeFile: string[];
    private sourceFiles: { [path: string]: string[] };
    private parsedMapPath: ParsedPath;

    constructor(private mapPath: string) {
        this.parsedMapPath = parsePath(mapPath);
        if (existsSync(this.mapPath)) {
            this.sourceMap = JSON.parse(readFileSync(this.mapPath).toString('utf8'));
        } else {
            console.warn('Failed to load sourceMap for', mapPath);
        }

        const codeFilePath = joinPath(this.parsedMapPath.dir, this.sourceMap.file);
        if (existsSync(codeFilePath)) {
            this.codeFile = readFileSync(joinPath(this.parsedMapPath.dir, this.sourceMap.file)).toString().split('\n');
        } else {
            console.warn('Failed to load code for', mapPath, 'and', this.sourceMap.file);
        }

        // const sourceFilePath = joinPath(__dirname, filePath);
        this.sourceFiles = this.sourceMap.sources.reduce((acc, filePath) => {
            const sourceFilePath = joinPath(this.parsedMapPath.dir, filePath);
            if (!existsSync(sourceFilePath)) {
                console.warn('Failed to find source file:', sourceFilePath)
            }
            return {
                ...acc,
                [filePath]: existsSync(sourceFilePath) ? readFileSync(sourceFilePath).toString().split('\n') : [],
            }
        }, {});

        let colCarry = 0n;
        let lineCarry = 0n;
        for (let segment of this.sourceMap.mappings.split(';')) {
            // lineCarry = 0n;
            const list: Mapping[] = [];

            let relativeTo: Mapping = { codeColumn: 0n, sourceLine: lineCarry, sourceColumn: colCarry };
            for (let vlq of segment.split(',')) {
                const chunk = SourceMapReader.parseChunk(vlq, relativeTo);
                list.push(chunk);
                relativeTo = chunk;
                colCarry = relativeTo.sourceColumn;
                lineCarry = relativeTo.sourceLine;
            }
            this.mappings.push(list);
        }

        // console.log(this.mappings);
    }

    map(line: bigint, column: bigint, lineStart?: string): string {

        const mappingsOfLine = this.mappings[Number(line)];
        const relevantMapping = mappingsOfLine
            .find(map => map.codeColumn <= column);
        // .sort((cur, prev) => Number(prev) - Number(cur))[0];

        if (relevantMapping) {
            const relevantIndex = mappingsOfLine.indexOf(relevantMapping);
            const sourceName = this.sourceMap.sources[
                Number(relevantMapping.sourceFileIdx || 0n)
            ];

            ok(sourceName, 'Expected reference to existing source file');

            const fullPath = joinPath(this.parsedMapPath.dir, sourceName);

            let sourceContent = this.sourceFiles[sourceName][Number(relevantMapping.sourceLine || 0)]
                .slice(
                    Number(relevantMapping.sourceColumn),
                    Number((mappingsOfLine[relevantIndex + 1] || {}).codeColumn || '0') || undefined
                );
            if (sourceContent === 'new ') {
                sourceContent = this.sourceFiles[sourceName][Number(relevantMapping.sourceLine || 0)]
                    .slice(
                        Number(relevantMapping.sourceColumn),
                        Number((mappingsOfLine[relevantIndex + 2] || {}).codeColumn || '0') || undefined
                    );
            }

            // print relative paths:
            // const sourcePath = (fullPath.indexOf(CWD) === 0) ? `.${fullPath.slice(CWD.length)}` : fullPath;
            // print relative from home path:
            // const sourcePath = (fullPath.indexOf(HOME) === 0) ? `~${fullPath.slice(HOME.length)}` : fullPath;

            // print full path:
            const sourcePath = fullPath;

            const printableLine = BigInt(relevantMapping.sourceLine || 0) + 1n;
            const printableColumn = BigInt(relevantMapping.sourceColumn || 0) + 1n;

            let beginning = lineStart;
            if (relevantMapping.symbolRef) {
                beginning = `    at ${this.sourceMap.names[Number(relevantMapping.symbolRef)]}`;
            }
            return `${beginning} (${sourcePath}:${printableLine}:${printableColumn})`;
        } else {
            // fallback. maybe add sanity check

            return;
        }
    }
    static parseChunk(chunk: string, relativeTo?: Mapping): Mapping {
        const nums = SourceMapReader.b64ToInts(chunk);
        return nums.reduce((acc, num, idx) => {
            const currentKey = IDX_MAP[idx] as keyof Mapping;

            return {
                ...acc,
                [IDX_MAP[idx]]:
                    num
                    + BigInt(relativeTo ? (relativeTo[currentKey] || 0) : 0),
            }
        }, { orig: chunk } as any);
    }

    static b64ToInts(
        chunk: string,
        decoded: bigint[] = [],
        acc: bigint = 0n,
        contDepth: bigint = 0n
    ): DecodedNumbers {
        const [first, ...rest] = [...chunk];

        const tail = rest.length ? rest.join('') : '';
        const idxInChars = CHARS.indexOf(first);
        const hasContinuationBit = !!(idxInChars & 32);
        const truncated = BigInt(idxInChars & 31);
        const continuationShifted = (truncated << (5n * contDepth));
        const withAccumulator = continuationShifted + acc;

        if (hasContinuationBit && tail) {
            if (!tail) {
                console.warn('No tail, but continuation bit?!');
                return;
            }
            return SourceMapReader.b64ToInts(tail, decoded, withAccumulator, contDepth + 1n);
        }
        const negMult = (Number(withAccumulator) & 1) ? -1 : 1;
        const num: bigint = BigInt((Number(withAccumulator) >>> 1) * negMult);

        if (tail.length === 0) {
            return [...decoded, num];
        }

        return SourceMapReader.b64ToInts(tail, [...decoded, num], 0n, 0n);
    }
}

