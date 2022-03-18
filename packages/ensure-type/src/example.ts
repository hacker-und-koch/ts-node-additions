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

const store = new TypeStore();

store.add(Foo);

console.log('>>>>> RESULT1', store.check({
    id: 5,
    text: 'Lorem Ipsum'
}, Foo));

console.log('>>>>> RESULT2', store.check({
    id: '5',
    text: 'Lorem Ipsum'
}, Foo));

console.log('>>>>> RESULT3', store.check({
    text: ''
}, Foo));

console.log('>>>>> RESULT4', store.check({
    id: 5,
    extra: 'key',
    text: 'Lorem Ipsum'
}, Foo));




