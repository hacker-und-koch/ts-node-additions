# @hacker-und-koch/getopt
## Option types
### `'boolean'`
Options of this type will not lead to collecting a value if provided. Instead it is only checked if either the argument vector or the process environment contain the configured value. The parsed value for an option of this type will always be `true` or `false`.

**Example:**
```
$ foo -x -y
getopt.shortOption('x') // true
getopt.shortOption('y') // true
getopt.shortOption('z') // false
```
### `'string'`
The parser will try to collect a value for if a `'string'` option is provided. It will raise an error if it failes to do so.

**Example:**
```
$ foo --bar baz
getopt.option('bar')    // 'baz'
getopt.option('lorem')  // undefined
```
### `'array'`
This option is very similar to the `'string'` type, but it allows for multiple mentions of the same option key. The parsed value of this option will always be a `string[]`.
**Example:**
```
$ foo --key val1 --key val2
getopt.option('key')    // ['val1', 'val2']
```
## Value Population
For every option it is tried to fetch a value in the following order. If none is found the returned value will be `false`, `undefined` or `[]` depending on the type.
```
+----------------------+
|      in command      |
|                      |
| -k=value     OR      |
| -k value     OR      |
| --key=value  OR      |
| --key value          |
+----------v-----------+
           |
+----------v-----------+
|    in environment    |
|                      |
| KEY=value            |
+----------v-----------+
           |
+----------v-----------+
|      in config       |
|                      |
| {                    |
|    ...               |
|    options: [{       |
|      type: 'string'  |
|      short: 'k',     |
|      long: 'key',    |
|      default: 'foo', |  <--
|      ...             | 
|    }]                |
| }                    |
+----------------------+
// use string[] default for 'array' type
```

### Emphasising `'array'` type population
For options of type `'array'` the evironment alias will only be used if there is no mention of the option in the command. It will not be added to the resulting array. Also the default values will only be provided as parsed result if the option is neither provided in the command call, nor the environment. There is no merging of arrays.

