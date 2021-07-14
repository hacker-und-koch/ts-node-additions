# @hacker-und-koch/di

## Basic Idea

Dependency injection allows to easily distribute class instances across an application runtime. It also supports comfortable mocking in unit tests and strong control for staged instantiation.

## Minimum Viable Example [[example](./src/examples/minimal.ts)]

```typescript
import { Application, bootstrap } from '@hacker-und-koch/di';

@Application()
class App { }

bootstrap(App);
```

## Hooks [[example](./src/examples/hooks.ts)]
```typescript
@Injectable()
class Worker implements 
    OnConfigure, 
    OnInit, 
    OnReady, 
    OnDestroy 
{
    async onConfigure() {}
    async onInit() {}
    onReady() {}
    async onDestroy() {}
}
```

## Logger [[example](./src/examples/logger.ts),[details](../logger)]
```typescript
@Injectable()
class MyWorker {

    constructor(private logger: Logger) {
        this.logger.info("Hi"); 
        // 2020-01-01T10:10:45.1234 (i) MyWorker: Hi
    }
}
```

## GetOpt [[example](./src/examples/getopt.ts),[details](../getopt)]
```typescript
@Injectable()
class MyWorker implements OnReady {

    constructor(private getopt: GetOpt) {}

    onReady() {
        this.getopt.option("host"); // "foo.com"
    }
}
```
```bash
$ yarn start --host=foo.com
```
### Configuring GetOpt
TODO; [meanwhile](../getopt)


## More Depth [[example](./src/example/worker-and-app.ts)]
```typescript
@Injectable()
class InnerWorker {}

@Injectable()
class OuterWorker {
    constructor(private worker: InnerWorker) {}
}

@Application({
    declarations: [
        InnerWorker,
        OuterWorker,
    ]
})
class App {    
    constructor(private worker: OuterWorker) {}
}
bootstrap(App, {
    log: "info"
});
```
leads to output:
```
<timespamp> (i) bootstrap: Target: App
<timespamp> (i) Providers: Created new instance of Logger for Providers.
<timespamp> (i) Providers: Creating new instance of GetOpt
<timespamp> (i) Providers: Creating new instance of InnerWorker
<timespamp> (i) Providers: Creating new instance of OuterWorker
<timespamp> (i) Providers: Configuring 5 instances
<timespamp> (i) Providers: Done configuring
<timespamp> (i) Providers: Initializing 5 instances
<timespamp> (i) Providers: Initialization complete
<timespamp> (i) Providers: Announcing ready state to 5 instances
<timespamp> (i) bootstrap: Done bootstraping App.
```

## Shared and Unique Instances [[example](./src/examples/shared-instance.ts)]
Instances can not only be injected via `constructor` arguments, but also via the `@Inject` decorator. This method also allows to provide a custom instance id. Therefore you can have classes instanciated multiple times and reused on demand.
```typescript
@Injectable()
class OuterWithSharedInstance {

    @Inject(Worker, 'foo')
    private worker1: Worker;

    @Inject(Worker, 'foo')
    private worker2: Worker;
}
```
```typescript
@Injectable()
class OuterWithUniqueInstances {

    @Inject(Worker, 'foo')
    private worker1: Worker;

    @Inject(Worker, 'bar')
    private worker2: Worker;
}
```

## Passing configs [[example](./src/examples/config.ts)]
```typescript

interface MyWorkerConfig {
    myOption: string;
}

@Injectable()
class MyWorker implements OnConfigure {

    @InjectConfiguration()
    private config: MyWorkerConfig;

    onConfigure() {
        console.log(`My option is: ${this.config.myOption}`);
    }
}

@Application({
    declarations: [MyWorker],
    configs: [config<MyWorkerConfig>(MyWorker, {
        myOption: 'foo',
    })]
})
class MyApp {
    constructor(worker: MyWorker) { }
}
```

## Bootstrap Options
TODO