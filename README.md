# TS Node Additions

[![npm version](https://badge.fury.io/js/%40hacker-und-koch%2Fdi.svg)](https://badge.fury.io/js/%40hacker-und-koch%2Fdi)
[![Test](https://github.com/hacker-und-koch/ts-node-additions/actions/workflows/test.yml/badge.svg)](https://github.com/hacker-und-koch/ts-node-additions/actions/workflows/test.yml)

## Maintained Packages

* **[dependency-injection](./packages/di)**
* **[getopt](./packages/getopt)**
* **[http](./packages/http)**
* **[logger](./packages/logger)**
* **[util](./packages/util)**

## System Requirements
* NodeJS
* Yarn

## Workflows
### Initial Setup
```bash
$ yarn setup
```

### Scripts Per Package
#### Build (Run `tsc`)
```bash
# in packages/$PACKAGE
$ yarn build
OR
$ yarn build:watch
```
#### Test (Run `jasmine`)
```bash
# in packages/$PACKAGE
$ yarn test
OR
$ yarn test:watch
```
#### Run Demo Code
```bash
# in packages/$PACKAGE
$ yarn start
OR
$ yarn start:watch
```
### Releases
Managed via [Github Actions](./.github/workflows/release). 

All packages in this repository will always be published together. So it may occur that one package is increased in version although it has no changes. This is done to ensure, that internal dependencies always work as intended and a dependent developer can be sure, that the installed versions are interoperable.
