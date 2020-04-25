# @hacker-und-koch/di
## Basic Idea
Dependency injection allows to easily distribute class instances across an application runtime. It also supports comfortable mocking in unit tests and strong control for staged instantiation.

## Minimum Viable Example [[file](./src/examples/minimal.ts)]
```typescript
import { Application, bootstrap } from '@hacker-und-koch/di';

@Application()
class App { }

bootstrap(App);
```
## Hooks
TODO

## Bootstrap Options
TODO

## Shared and Unique Instances
TODO

## Instance IDs
TODO

## Logger
TODO

## GetOpt
TODO
