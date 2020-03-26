# TS Node Additions
## Maintained Packages

* [logger](./packages/logger)
* [getopt](./packages/getopt)
* [util](./packages/util)
* [dependency-injection](./packages/di)
* [http](./packages/http)

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
#### pre requirements
```
$ npm adduser
```
#### apply new version and publish packages
```
$ git checkout master
$ git merge --no-ff develop
$ node .run.js release
```
