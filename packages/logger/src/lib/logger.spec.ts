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

        const formatArg: LoggerPackage = spies.format.calls.mostRecent().args[0] as LoggerPackage;
        const onlogArg: LoggerPackage = spies.format.calls.mostRecent().args[0] as LoggerPackage;

        expect(onlogArg.class).toEqual("test");
        expect(onlogArg.id).toEqual("case");
        expect(onlogArg.level).toEqual("spam");
        expect(onlogArg.parts).toEqual(["spam"]);
        expect(onlogArg.time).toBeInstanceOf(Number);

        expect(formatArg.class).toEqual("test");
        expect(formatArg.id).toEqual("case");
        expect(formatArg.level).toEqual("spam");
        expect(formatArg.parts).toEqual(["spam"]);
        expect(formatArg.time).toBeInstanceOf(Number);

        expect(spies.writeOut).toHaveBeenCalled();
    });

    it("creates log package for level 'spam'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.spam("spam");
        
        const onlogArg: LoggerPackage = spies.format.calls.mostRecent().args[0] as LoggerPackage;

        expect(onlogArg.class).toEqual("test");
        expect(onlogArg.id).toEqual("case");
        expect(onlogArg.level).toEqual("spam");
        expect(onlogArg.parts).toEqual(["spam"]);
        expect(onlogArg.time).toBeInstanceOf(Number);
        
    });

    it("creates log package for level 'info'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.info("info");

        const onlogArg: LoggerPackage = spies.format.calls.mostRecent().args[0] as LoggerPackage;

        expect(onlogArg.class).toEqual("test");
        expect(onlogArg.id).toEqual("case");
        expect(onlogArg.level).toEqual("info");
        expect(onlogArg.parts).toEqual(["info"]);
        expect(onlogArg.time).toBeInstanceOf(Number);
    });

    it("creates log package for level 'log'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.log("log");

        const onlogArg: LoggerPackage = spies.format.calls.mostRecent().args[0] as LoggerPackage;

        expect(onlogArg.class).toEqual("test");
        expect(onlogArg.id).toEqual("case");
        expect(onlogArg.level).toEqual("log");
        expect(onlogArg.parts).toEqual(["log"]);
        expect(onlogArg.time).toBeInstanceOf(Number);
    });

    it("creates log package for level 'warn'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.warn("warn");

        const onlogArg: LoggerPackage = spies.format.calls.mostRecent().args[0] as LoggerPackage;

        expect(onlogArg.class).toEqual("test");
        expect(onlogArg.id).toEqual("case");
        expect(onlogArg.level).toEqual("warn");
        expect(onlogArg.parts).toEqual(["warn"]);
        expect(onlogArg.time).toBeInstanceOf(Number);
    });

    it("creates log package for level 'error'.", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        logger.error("error");

        const onlogArg: LoggerPackage = spies.format.calls.mostRecent().args[0] as LoggerPackage;

        expect(onlogArg.class).toEqual("test");
        expect(onlogArg.id).toEqual("case");
        expect(onlogArg.level).toEqual("error");
        expect(onlogArg.parts).toEqual(["error"]);
        expect(onlogArg.time).toBeInstanceOf(Number);
    });

    it("can be built with default formatter", () => {
        const { logger, spies } = createTestLoggerAndSpies();

        expect(logger.spam('moin')).toBeTruthy();
        expect(spies.writeOut as any).toHaveBeenCalledWith('  -  test[case]: moin\n');

        logger.warn(JSON.stringify({ 'x': 'y', 'z': 42 }, null, 4));
        expect(spies.writeOut as any).toHaveBeenCalledWith(
            ' [x] test[case]: {\n' +
            ' [x] test[case]:     "x": "y",\n' +
            ' [x] test[case]:     "z": 42\n' +
            ' [x] test[case]: }\n'
        );

        logger.error('Going to stderr');
        expect(spies.writeErr).toHaveBeenCalledWith(' !!! test[case]: Going to stderr\n');
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
