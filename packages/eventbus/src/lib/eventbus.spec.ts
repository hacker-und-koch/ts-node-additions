import { StepTester } from "@hacker-und-koch/di";
import { Eventbus } from "./eventbus";

describe('Eventbus', () => {
    it('forwards messages', async (done) => {
        const step_tester: StepTester<Eventbus<'test', number>> = await StepTester.withTarget(Eventbus).build();
        
        step_tester.instance.on('test', d => {
            expect(d).toBe(5);
            done();
        });

        step_tester.instance.emit('test', 5);
    });
});
