import { GetOpt, GetOptOptions } from "./lib";

const opts: GetOptOptions = [
    { long: 'foo', type: 'array', default: [] },
    { long: 'bar', type: 'string' },
    { long: 'opt', type: 'array', short: 'o' },
    { long: 'opt2', type: 'string', required: true },
    { long: 'aaa', short: 'a' },
    { long: 'xxx', short: 'x' },
    { long: 'yyy', short: 'y' },
    { long: 'zzz', short: 'z' },
    { long: 'recursive', short: 'R' },
    { long: 'na1', type: 'boolean' },
    { long: 'na2' },
    { long: 'def-bol', default: true },
    { long: 'from-def', default: 'defffault', type: 'string' },
    { long: 'def-arr', default: ['default-arr'], type: 'array' },
    { long: 'lang', env: 'LANG', default: 'not used', type: 'string' },
];

const argv = [
    '_0',
    '_1',
    '--foo',
    'val0',
    '--bar=23',
    'foo',
    '--opt',
    'val1',
    'pos1',
    '-a',
    '-xyz',
    '-o',
    'val2',
    'pos2',
    '-o=val2.5',
    '--opt2',
    'val3',
    'pos3',
    '--',
    '--from',
    'now',
    'on every',
    'thing',
    '-i',
    '5',
    'an argument'
];

// const getopt = new GetOpt({
//     options: opts,
//     env: { 'LANG': 'BR_bork' },
//     argv: argv
// });

// console.log(
//     getopt,
//     getopt['configuration'].options
// );

// new GetOpt({
//     options: opts,
//     args: { name: 'dies', info: 'does stuffs', required: true },
//     argv: ['_0', './fake.js', '-h'],
//     env: {}
// });

// console.log(new GetOpt({
//     options: opts,
//     args: [{
//         name: 'dies',
//         info: 'does stuffs',
//         required: true,
//         children: [{
//             name: 'foo',
//             info: '',
//             command: true,
//             children: [
//                 {
//                     info: 'everything is awesome',
//                     name: 'posArg1',
//                     spreads: true,

//                 }
//             ]

//         }],
//     }],
//     argv,
//     env: {}
// }).posTree);

// console.log(new GetOpt({
//     options: opts,
//     args: [{
//         name: 'mv',
//         info: 'does stuffs',
//         command: true,
//         children: [
//             {
//                 info: 'pseudo move of files',
//                 name: 'from',
//             },
//             {
//                 info: 'pseudo move of files',
//                 name: 'to',
//             }
//         ]
//     }],
//     argv: ['_0', '_1', 'mv', 'from here', 'to there'],
//     env: {}
// }).posTree);


const fsArgs = [{
    name: 'mv',
    info: 'mv style arguments',
    command: true,
    children: [
        {
            name: 'from',
            info: 'source',
            required: true,
        },
        {
            name: 'to',
            info: 'target',
            required: true,
        }
    ]
}, {
    name: 'chmod',
    info: 'does stuffs',
    command: true,
    children: [
        {
            name: 'modifier',
            info: 'modifier char magics',
            required: true,
        },
        {
            name: 'files',
            info: 'files to modify',
            required: true,
            spreads: true
        }
    ]
}, {
    
    name: 'ls',
    info: 'ls style arguments',
    command: true,
    children: [{
        name: 'files',
        info: 'files to list',
        spreads: true,
    }]
}];

console.log('1', new GetOpt({
    options: [{ 'long': 'rec', 'short': 'R' }],
    // args: fsArgs,
    argv: ['_0', '_1', 'mv', 'from here', 'to there'],
    env: {}
}).posTree);

const go0 = new GetOpt({
    options: [{ 'long': 'rec', 'short': 'R' }],
    // args: fsArgs,
    argv: ['_0', '_1', 'ls', '/some/file1', '/some/more/file*'],
    env: {}
});
console.log('2', go0.posTree);

console.log('3', new GetOpt({
    options: [{ 'long': 'rec', 'short': 'R' }],
    // args: fsArgs,
    argv: ['_0', '_1', 'chmod', '-R', 'u+x', 'file1', 'file2', '-h'],
    env: {}
}).posTree);

// new GetOpt({
//     options: [],
//     args: {
//         name: 'dies',
//         info: 'does stuffs',
//         required: true,
//         commands: {
//             foo: {
//                 info: 'everything is awesome',
//                 name: 'posArg1',
//                 spreads: true,
//             }
//         },
//     },
//     argv: ['node', './fake.js', 'posArg1',],
//     env: {}
// })['printHelp']();