import { hasKeys } from './has-keys';

describe("hasKeys", () => {
    it("naivly detects existence of keys in an object", () => {
        expect(hasKeys({})).toBeFalse();
        expect(hasKeys({ a: 1 })).toBeTrue();
    });
});
