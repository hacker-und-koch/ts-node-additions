import { SourceMapReader } from './source-map-reader';
import { join as joinPath } from 'path';
import { doesNotWork } from './sub-example';
import { ErrorParser } from './error-parser';

ErrorParser.registerErrorHandling();

callingExternalFailure();

function callingExternalFailure() {
    doesNotWork();
}
