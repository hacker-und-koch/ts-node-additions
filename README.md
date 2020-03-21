# TS Node Additions

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
```
$ yarn release
```
