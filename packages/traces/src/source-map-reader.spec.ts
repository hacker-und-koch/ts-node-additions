import { SourceMapReader } from './source-map-reader';

describe("SourceMapReader", () => {
    it("converts base64 chunks to BigInt[]", () => {
        expect(SourceMapReader.b64ToInts('AAAA')).toEqual([0n, 0n, 0n, 0n]);
        expect(SourceMapReader.b64ToInts('IAAM')).toEqual([4n, 0n, 0n, 6n]);
        expect(SourceMapReader.b64ToInts('JAAM')).toEqual([-4n, 0n, 0n, 6n]);
        expect(SourceMapReader.b64ToInts('JAAM')).toEqual([-4n, 0n, 0n, 6n]);
        expect(SourceMapReader.b64ToInts('yB')).toEqual([25n]);
        expect(SourceMapReader.b64ToInts('IyBAM')).toEqual([4n, 25n, 0n, 6n]);
    });

    it("maps arrays to objects", () => {
        expect(SourceMapReader.parseChunk('IAAM')).toEqual({
            codeColumn: 4n,
            sourceFileIdx: 0n,
            sourceLine: 0n,
            sourceColumn: 6n,
        });
    });
});
