import { Logger } from "./logger";
import { NoFormatFunctionError } from './errors';
import { LoggerPackage } from "./models";

describe("Logger", () => {
    it("errors when used without setting 'onlog' function.", () => {
        const logger = new Logger("Foo");
        expect(() => logger.log("will throw"))
            .toThrow(new NoFormatFunctionError());
    });

    it("calls write() and format() when onlog() is called", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.spam("spam");

        expect(spies.onlog).toHaveBeenCalledWith({
            class: "test",
            id: "case",
            level: "spam",
            parts: ["spam"]
        });
        
        expect(spies.format).toHaveBeenCalledWith({
            class: "test",
            id: "case",
            level: "spam",
            parts: ["spam"]
        });
        
        expect(spies.writeOut).toHaveBeenCalled();
    });

    it("creates log package for level 'spam'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.spam("spam");

        expect(spies.onlog).toHaveBeenCalledWith({
            class: "test",
            id: "case",
            level: "spam",
            parts: ["spam"]
        });
    });

    it("creates log package for level 'info'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.spam("spam");

        expect(spies.onlog).toHaveBeenCalledWith({
            class: "test",
            id: "case",
            level: "spam",
            parts: ["spam"]
        });
    });

    it("creates log package for level 'log'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.log("log");

        expect(spies.onlog).toHaveBeenCalledWith({
            class: "test",
            id: "case",
            level: "log",
            parts: ["log"]
        });
    });

    it("creates log package for level 'warn'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.warn("warn");

        expect(spies.onlog).toHaveBeenCalledWith({
            class: "test",
            id: "case",
            level: "warn",
            parts: ["warn"]
        });
    });

    it("creates log package for level 'error'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.error("error");

        expect(spies.onlog).toHaveBeenCalledWith({
            class: "test",
            id: "case",
            level: "error",
            parts: ["error"]
        });
    });

    it("can be built with default formatter", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        expect(logger.spam('moin')).toBeTruthy();
        expect(spies.writeOut as any).toHaveBeenCalledWith('test[case]  -  moin\n');
        
        logger.warn(JSON.stringify({ 'x': 'y', 'z': 42 }, null, 4));
        expect(spies.writeOut as any).toHaveBeenCalledWith(
            'test[case] [x] {\n' +
            'test[case] [x]     "x": "y",\n' +
            'test[case] [x]     "z": 42\n' +
            'test[case] [x] }\n'
        );

        logger.error('Going to stderr');
        expect(spies.writeErr).toHaveBeenCalledWith('test[case] !!! Going to stderr\n');
    });
});

function createTestLoggerAndSpies() {
    const stdout = { write: (str: string) => true };
    const stderr = { write: (str: string) => true };

    const logger = Logger.build()
        .className('test')
        .id('case')
        .stdout(stdout as any)
        .stderr(stderr as any)
        .noTimestamp()
        .create();

    return {
        logger: logger,
        spies: {
            onlog: spyOn(logger as any, 'onlog').and.callThrough(),
            format: spyOn(logger as any, 'format').and.callThrough(),
            writeOut: spyOn(stdout, 'write').and.callThrough(),
            writeErr: spyOn(stderr, 'write').and.callThrough(),
        }
    };
}
