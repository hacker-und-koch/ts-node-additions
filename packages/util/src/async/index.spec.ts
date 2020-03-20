import * as Async from ".";

describe("Asnyc", () => {
    it("collects async functions calls", (done) => {
        Async.collect([
            async () => 1,
            async () => 2,
            async () => "b",
            async () => "c",
        ] as (() => Promise<any>)[])
            .then(result => {
                expect(result).toEqual([1, 2, "b", "c"])
                done();
            });
    });
    it("delays time", (done) => {
        const pre = Date.now();
        const delay = 100;

        Async.delay(delay)
            .then(ms => {
                const post = Date.now();
                expect(ms).toBe(delay);
                expect(post - pre).toBeLessThan(delay + 5);
                expect(post - pre).toBeGreaterThan(delay - 5);
                done();
            });
    });
    it("echos value", (done) => {
        const val = 5;
        Async.of(val)
            .then((res: typeof val) => {
                expect(res).toEqual(val);
                done();
            });
    });
});