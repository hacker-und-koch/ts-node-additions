import { deepCopy } from './deep-copy';

describe("DefaultName", () => {
    it("erros if called with non-existent file", () => {
        expect(() => deepCopy("does-not-exist", ""))
            .toThrowError('"does-not-exist" is not a file');
    });

    it("erros if called with non-directory file", () => {
        expect(() => deepCopy(__filename, ""))
            .toThrowError(`"${__filename}" is not a directory`);
    });

});