import { SourceMapReader } from './source-map-reader';

describe("SourceMapReader", () => {
    it("converts base64 chunks to BigInt[]", () => {
        expect(SourceMapReader.b64ToInts('AAAA')).toEqual([0n, 0n, 0n, 0n]);
        expect(SourceMapReader.b64ToInts('IAAM')).toEqual([4n, 0n, 0n, 6n]);
        expect(SourceMapReader.b64ToInts('JAAM')).toEqual([-4n, 0n, 0n, 6n]);
        expect(SourceMapReader.b64ToInts('yB')).toEqual([25n]);  // <
        expect(SourceMapReader.b64ToInts('IyBAM')).toEqual([4n, 25n, 0n, 6n]);
        expect(SourceMapReader.b64ToInts('AAED')).toEqual([0n, 0n, 2n, -1n]);  // D  => 000011 => -0000001 => -000001
        expect(SourceMapReader.b64ToInts('SAAgB')).toEqual([9n, 0n, 0n, 16n]); // S  => 010010 => 
        expect(SourceMapReader.b64ToInts('WAAW')).toEqual([11n, 0n, 0n, 11n]);  
        expect(SourceMapReader.b64ToInts('IACvB')).toEqual([4n, 0n, 1n, -23n]); // vB: v => 101111 => -23c ; B => 000001 => 1 ??
    });

    it("maps arrays to objects", () => {
        expect(SourceMapReader.parseChunk('IAAM')).toEqual({
            codeColumn: 4n,
            sourceFileIdx: 0n,
            sourceLine: 0n,
            sourceColumn: 6n,
            orig: 'IAAM',
        });
    });
});
