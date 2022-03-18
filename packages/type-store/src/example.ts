import {
    DataType,
    Mandatory,
    Optional,
    TypeStore
} from './index';

@DataType()
class Foo {
    @Optional()
    description: string;
    @Mandatory()
    id: number;
    @Mandatory()
    text: string;
}

@DataType()
class Bar {
    @Mandatory()
    someKey: Foo;
    @Optional()
    id: bigint;
    @Optional()
    name: string;
}

const store = new TypeStore();

store.add(Foo);
store.add(Bar);

console.log('TEMPLATES >>>', store.storage);

console.log('RESULT 1 >>>', store.check({
    id: 5,
    text: 'Lorem Ipsum'
}, Foo));

console.log('RESULT 2 >>>', store.check({
    id: '5',
    text: 'Lorem Ipsum'
}, Foo));

console.log('RESULT 3 >>>', store.check({
    text: ''
}, Foo));

console.log('RESULT 4 >>>', store.check({
    id: 5,
    extra: 'key',
    text: 'Lorem Ipsum'
}, Foo));


console.log('RESULT 5 >>>', store.check({
    someKey: {
        id: 1,
        text: 'sid amet',
    },
    id: BigInt(200),
}, Bar));

console.log('RESULT 6 >>>', store.check({
    someKey: {
        id: 'nope',
        text: 5,
    },
    id: BigInt(200),
}, Bar));

console.log('RESULT 7 >>>', store.check({}, Bar));

console.log('SCHEMAS >>>', JSON.stringify(store.schemas, null, 2));
