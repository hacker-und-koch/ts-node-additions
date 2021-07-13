import { GetOpt } from './lib';

const argv = [
    '/_0/foo/bar/node',
    '/_1/test.js',
    '--foo',
    'val0',
    '--bar=23',
    'pos0',
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

const getopt = new GetOpt({
    appName: 'getopt-example',
    options: [
        {
            short: 'f',
            type: 'array',
            long: 'foo',
            valueName: 'my-val'
        },
        {
            short: 'a',
            type: 'boolean',
            long: 'foo1',
        },
        {
            short: 'x',
            type: 'boolean',
            long: 'foo2',
        },
        {
            short: 'y',
            type: 'boolean',
            long: 'foo3',
        },
        {
            short: 'z',
            type: 'boolean',
            long: 'foo4',
        },
        {
            short: 'o',
            type: 'array',
            long: 'opt',
        },
        {
            // short: 'b',
            type: 'array',
            long: 'bar'
        },
        {
            short: 'k',
            type: 'array',
            long: 'opt2'
        }
    ],
    positionalArgs: [
        {
            name: 'some-more-args',
            // maniditory: true,
            multi: true,
        }
    ]
}, argv);

console.log(getopt.result);

console.log(getopt.usage);
