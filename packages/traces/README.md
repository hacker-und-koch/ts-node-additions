# @hacker-und-koch/di

## Basic Idea
Parses source maps to convert JS references in stack traces to TS references. 

## Usage
```typescript
import '@hacker-und-koch/traces';
```

In order to disable the monkey patch set environment variable `NO_TRACE_MAPPING` to any truthy value.

example:
```
$ NO_TRACE_MAPPING=1 node my-script.js
```
