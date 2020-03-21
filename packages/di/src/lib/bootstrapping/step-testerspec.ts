import { StepTester, DefaultClass } from './step-tester';
import { Injectable } from '../decorators';

describe("StepTester", () => {
    let tester: StepTester<any>;

    beforeAll(async done => {
        tester = await StepTester.new()
            .build();
        done();
    });

    it("can be build via 'new().build()'", () => {
        expect(tester instanceof StepTester).toBeTruthy();
    });

    it("created an instance itself", () => {
        expect(tester.instance instanceof DefaultClass).toBeTruthy();
    });

    it("creates custom type with 'withTarget()'", async done => {
        @Injectable()
        class Temp {};

        const temp_tester = await StepTester.withTarget(Temp).build();

        

        expect(temp_tester.instance instanceof Temp).toBeTruthy();

        done();
    });

    afterAll(async done => {
        await tester.destroy();
        done();
    });
});
