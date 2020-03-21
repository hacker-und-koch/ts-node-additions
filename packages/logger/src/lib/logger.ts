/**
 * Log Levels (from spam to error):
 *  - spam
 *  - info
 *  - log
 *  - warn
 *  - error
 */

import { LoggerPackage, LoggerOptions, Loglevel } from './models';
import { NoFormatFunctionError } from './errors';
import { FormatFunction } from './models/format-function';
import { format as utilFormat } from 'util';
import { EOL } from 'os';

export class Logger {

    private logLevels: Loglevel[] = ['spam', 'info', 'log', 'warn', 'error'];

    private stdout: NodeJS.WriteStream = process.stdout;
    private stderr: NodeJS.WriteStream = process.stderr;

    private activeLogLevel: Loglevel = 'spam';

    constructor(public className: string, private id?: string) {

    }

    private format: FormatFunction = (logPackage: LoggerPackage) => {
        throw new NoFormatFunctionError();
    }

    private onlog(loggerPackage: LoggerPackage): boolean {
        const idxPackage = this.logLevels.indexOf(loggerPackage.level);
        const idxOptions = this.logLevels.indexOf(this.activeLogLevel);

        if (idxPackage >= idxOptions) {
            const stream = loggerPackage.level === "error" ? this.stderr : this.stdout;
            return stream.write(this.format(loggerPackage));
        }

        return false;
    }

    spam(...args: any[]): boolean {
        return this.onlog({
            level: "spam",
            class: this.className,
            id: this.id,
            parts: args
        });
    }

    info(...args: any[]): boolean {
        return this.onlog({
            level: "info",
            class: this.className,
            id: this.id,
            parts: args
        });
    }

    log(...args: any[]): boolean {
        return this.onlog({
            level: "log",
            class: this.className,
            id: this.id,
            parts: args
        });
    }

    warn(...args: any[]): boolean {
        return this.onlog({
            level: "warn",
            class: this.className,
            id: this.id,
            parts: args
        });
    }

    error(...args: any[]): boolean {
        return this.onlog({
            level: "error",
            class: this.className,
            id: this.id,
            parts: args
        });
    }

    static build() {
        return new LoggerBuilder();
    }

}

class LoggerBuilder {
    private _className: string;
    private _id: string;
    private _level: Loglevel;
    private _format: FormatFunction;
    private _stdout: NodeJS.WriteStream;
    private _stderr: NodeJS.WriteStream;
    private _noTimestamp: boolean;

    id(id: string): this {
        if (typeof this._id !== "undefined") {
            throw new Error("'id' already set for Logger.")
        }
        this._id = id;

        return this;
    }

    className(className: string): this {
        if (typeof this._className !== "undefined") {
            throw new Error("'className' already set for Logger.")
        }
        this._className = className;

        return this;
    }

    level(level: Loglevel): this {
        if (typeof this._level !== "undefined") {
            throw new Error("'level' already set for Logger.")
        }
        this._level = level;

        return this;
    }

    format(format: (pkg: LoggerPackage) => string | Buffer): this {
        if (typeof this._format !== "undefined") {
            throw new Error("'format' already set for Logger.")
        }
        this._format = format;

        return this;
    }

    stdout(stream: NodeJS.WriteStream): this {
        if (typeof this._stdout !== "undefined") {
            throw new Error("'stdout' already set for Logger.")
        }
        this._stdout = stream;

        return this;
    }

    stderr(stream: NodeJS.WriteStream): this {
        if (typeof this._stderr !== "undefined") {
            throw new Error("'stderr' already set for Logger.")
        }
        this._stderr = stream;

        return this;
    }

    noTimestamp(): this {
        this._noTimestamp = true;

        return this;
    }


    create() {
        if (typeof this._className === "undefined") {
            throw new Error("'className' not set. Please call '.className()' before calling '.create()'.");
        }

        if (typeof this._format === "undefined") {
            this._format = this.defaultFormat();
        } else if (this._noTimestamp) {
            throw new Error('Cannot create Logger with noTimestap() AND onlog() called.');
        }

        if (!this._stdout) {
            this._stdout = process.stdout;
        }
        if (!this._stderr) {
            this._stderr = process.stderr;
        }

        const logger = new Logger(this._className, this._id);

        logger['stdout'] = this._stdout;
        logger['stderr'] = this._stderr;

        logger['format'] = this._format || this.defaultFormat();

        logger['activeLogLevel'] = this._level || 'spam';

        return logger;
    }

    private defaultFormat(): FormatFunction {
        return (pkg: LoggerPackage) => {
            let windowX = -1;
            try {
                windowX = this._stdout.getWindowSize()[0];
            } catch (e) {
                // ignore, since we can just print everything into one line.
            }

            const rawOutput = (utilFormat as any)(...pkg.parts);

            return rawOutput.split('\n')
                .map((line: string): string => {
                    const lvlPart = this.defaultLevelToChars(pkg.level);
                    const idPart = pkg.id ? `[${pkg.id}]` : '';
                    const timePart = this._noTimestamp ? '' : this.defaultTimestamp();
                    const timeUntilClass = `${timePart}${lvlPart}${pkg.class}${idPart}: `;
                    let formatedLine = line + '\n';
                    if (windowX > 0) {
                        const maxTextWidth = windowX - timeUntilClass.length;
                        const lines = [];
                        for (let segment of line.split(' ')) {
                            let idx = lines.length - 1;
                            if (idx < 0) {
                                lines.push(segment);
                            } else if ((lines[idx].length + segment.length + 1) > maxTextWidth) {
                                lines.push(segment);
                            } else {
                                lines[idx] += ` ${segment}`;
                            }
                        }
                        formatedLine = lines.reduce((acc, cur, idx) => {
                            if (idx > 0) {
                                cur = cur.padStart(timeUntilClass.length + cur.length);
                            }
                            return `${acc}${cur}\n`;
                        }, '');
                    }
                    return `${timeUntilClass}${formatedLine}`;
                })
                .join('');
        }
    }

    private defaultTimestamp(): string {
        return new Date(Date.now()).toISOString();
    }

    private defaultLevelToChars(level: Loglevel): string {
        switch (level) {
            case "spam":
                return '  -  ';
            case "info":
                return ' (i) ';
            case "log":
                return '     ';
            case "warn":
                return ' [x] ';
            case "error":
                return ' !!! ';
            default:
                throw new Error('Unsupported loglevel.');
        }
    }
}