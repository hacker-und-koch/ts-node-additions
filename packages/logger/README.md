# @hacker-und-koch/logger
## Table Of Content
* [Creating a Logger](#creating-a-logger)
* [Log Levels](#log-levels)
* [Line Formatting](#line-formatting)
* [`LoggerBuilder`](#loggerbuilder)

## Creating a Logger
### Builder pattern
```typescript
const loggerBuilder: LoggerBuilder = Logger.build();

loggerBuilder.className('MyClass');  // manditory!

const logger: Logger = loggerBuilder.create();

logger.log('lorem ipsum');
```
### Via Dependency Injection
```typescript
import { Injectable } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';

@Injectable()
class MyClass {
    constructor(private logger: Logger) {
        this.logger.log('lorem ipsum');
    }
}
```
## Log Levels
### Order Of Significance
Highest to lowest:
* error
* warning
* log
* info
* spam

### Calling logger by level
```typescript
logger.spam('lorem');
logger.info('ipsum');
logger.log('dolor');
logger.warn('sit');
logger.error('amet');
```


## Line Formatting
### Default formatting ([example](./src/examples/basic-logger.ts))
Above examples will print
```log
2020-01-02T03:04:50.001Z  -  MyClass: lorem
2020-01-02T03:04:50.002Z (i) MyClass: ipsum
2020-01-02T03:04:50.003Z     MyClass: dolor
2020-01-02T03:04:50.004Z [x] MyClass: sit
2020-01-02T03:04:50.005Z !!! MyClass: amet
```
### Overwriting FormatFunction
```typescript
const formatFunction: FormatFunction = (pkg: LoggerPackage): Buffer | string => {
    const argsAsString = pkg.parts
        .map(arg => arg.toString())
        .join('+++');
    return `[${pkg.class}] ${argsAsString}\n`;
}

const logger: Logger = Logger.build()
    .className('MyClass')
    .format(formatFunction)
    .create();

logger.log('lorem', 'ipsum');
```
prints
```log
[MyClass] lorem+++ipsum
```

## `LoggerBuilder`
### 

### `className(className: string): this`
Set class name to be used when formatting log output.
(( manditory! ))


@param {`string`:} className    Class name used when formatting log output.

### `create(): Logger`
Calling this function will finish the building process.
A new instance of `Logger` will be created and configured
according to the `LoggerBuilder`'s state.

### `id(id: string): this`
Set ID of instance. Is utilized by di package.


@param `id`:    ID of instance to be used when
             formatting log output.


### `level(level: Loglevel): this`
Set threshold level for Logger. Only logs with level of
 equal or greater importance to this value will be printed.


@param `level`:     Threshold level for Logger

### `format(format: FormatFunction): this`
Set Logger's `FormatFunction`.


@param `format`:    Mapping function to format log lines

### `stdout(stream: NodeJS.WriteStream): this`
`WriteStream` used for levels `'spam'`, `'info'` and `'log'`.


@param `stream`:    stdout stream

### `stderr(stream: NodeJS.WriteStream): this`
`WriteStream` used for levels `'warning'` and `'error'`.


@param `stream`:    stdout stream

### `noTimestamp(): this`
If called: Logger's formating function will not include a timestamp

