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
    { long: 'na1', type: 'boolean' },
    { long: 'na2' },
    { long: 'def-bol', default: true },
    { long: 'from-def', default: 'defffault', type: 'string' },
    { long: 'def-arr', default: ['default-arr'], type: 'array' },
    { long: 'lang', env: 'LANG', default: 'not used', type: 'string' },
];

const getopt = new GetOpt({
    options: opts,
    env: { 'LANG': 'BR_bork' },
    argv: [
        '_0',
        '_1',
        '--foo',
        'pos0',
        '--bar=23',
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
    ]
});

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

new GetOpt({
    // options: opts,
    args:  {
        name: 'dies',
        info: 'does stuffs',
        required: true,
        commands: {
            foo: {
                info: 'everything is awesome',
                name: 'posArg1',
                spreads: true,
            }
        },
    },
    argv: ['node', './fake.js', 'foo', 'posArg1',],
    env: {}
})['printHelp']();

new GetOpt({
    options: [],
    args:  {
        name: 'dies',
        info: 'does stuffs',
        required: true,
        commands: {
            foo: {
                info: 'everything is awesome',
                name: 'posArg1',
                spreads: true,
            }
        },
    },
    argv: ['node', './fake.js', 'posArg1',],
    env: {}
})['printHelp']();