/**
 * Shout out to Lachlan Miller!
 *  (https://lachlan-miller.me/articles/decoding-variable-length-quantity-vlq-for-source-maps)
 */

import { SourceMap } from './models';
import { resolve as resolvePath, join as joinPath, parse as parsePath, ParsedPath } from 'path';
import { readFileSync } from 'fs';

// const CWD = process.cwd();
// const HOME = process.env.HOME;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const IDX_MAP = [
    "codeColumn",
    "sourceFileIdx",
    "sourceLine",
    "sourceColumn",
    "sourceName",
];

interface Mapping {
    codeColumn: bigint;
    sourceFileIdx?: bigint;
    sourceLine?: bigint;
    sourceColumn?: bigint;
    sourceName?: bigint;
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
        this.sourceMap = JSON.parse(readFileSync(this.mapPath).toString('utf8'));
        this.codeFile = readFileSync(joinPath(this.parsedMapPath.dir, this.sourceMap.file)).toString().split('\n');

        this.sourceFiles = this.sourceMap.sources.reduce((acc, filePath) => ({
            ...acc,
            [filePath]: readFileSync(joinPath(__dirname, filePath)).toString().split('\n'),
        }), {});

        let lineCarry = 0n;
        let colCarry = 0n;
        for (let segment of this.sourceMap.mappings.split(';')) {
            const list: Mapping[] = [];
            let relativeTo: Mapping = { codeColumn: 0n, sourceLine: lineCarry, sourceColumn: colCarry };
            for (let vlq of segment.split(',')) {
                const chunk = SourceMapReader.parseChunk(vlq, relativeTo);
                list.push(chunk);
                relativeTo = chunk;
            }
            this.mappings.push(list);
            lineCarry = relativeTo.sourceLine;
            colCarry = relativeTo.sourceColumn;
        }
    }

    map(line: bigint, column: bigint): string {

        const mappingsOfLine = this.mappings[Number(line)];
        const relevantMapping = mappingsOfLine
            .filter(map => map.codeColumn <= column)
            .reverse()[0];

        if (relevantMapping) {
            const relevantIndex = mappingsOfLine.indexOf(relevantMapping);
            const sourceName = this.sourceMap.sources[
                Number(relevantMapping.sourceFileIdx)
            ];
            const fullPath = joinPath(this.parsedMapPath.dir, sourceName);

            let sourceContent = this.sourceFiles[sourceName][Number(relevantMapping.sourceLine)]
                .slice(
                    Number(relevantMapping.sourceColumn),
                    Number((mappingsOfLine[relevantIndex + 1] || {}).codeColumn || '0') || undefined
                );
            if (sourceContent === 'new ') {
                sourceContent = this.sourceFiles[sourceName][Number(relevantMapping.sourceLine)]
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

            const printableLine = relevantMapping.sourceLine + 1n;
            const printableColumn = relevantMapping.sourceColumn + 1n;
            return `    at ${sourceContent} (${sourcePath}:${printableLine}:${printableColumn})`;
        } else {

            // fallback. maybe add sanity check

            return;
        }
    }
    static parseChunk(chunk: string, relativeTo?: Mapping): Mapping {
        const nums = SourceMapReader.b64ToInts(chunk);

        return nums.reduce((acc, num, idx) => ({
            ...acc,
            [IDX_MAP[idx]]:
                num +
                (relativeTo ? (relativeTo[IDX_MAP[idx] as keyof Mapping] || 0n) : 0n),
        }), {} as any);
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
        const negMult = (withAccumulator & 1n) ? -1n : 1n;
        const num: bigint = BigInt(withAccumulator >> 1n) * negMult;
        if (tail.length === 0) {
            return [...decoded, num];
        }
        return SourceMapReader.b64ToInts(tail, [...decoded, num], 0n, 0n);
    }
}

