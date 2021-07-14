import { arrflat } from './arrflat';

describe("arrflat", () => {
    it("does not alter 1dim array", () => {
        const _1dim = ["1", "2", "3", "4"];
        expect(arrflat(_1dim)).toEqual(_1dim);
    });

    it("flats 2dim array", () => {
        const _2dim = ["1", ["2", "3"], "4", ["5"]];
        const _2dim_flat = ["1", "2", "3", "4", "5"];

        expect(arrflat(_2dim)).toEqual(_2dim_flat);
    });

    it("flats 3dim array", () => {
        const _3dim = [["1"], ["2", ["3"]], "4" , ["5", ["6"]]];
        const _3dim_flat = ["1", "2", "3", "4", "5", "6"];

        expect(arrflat(_3dim)).toEqual(_3dim_flat);
    });
});
