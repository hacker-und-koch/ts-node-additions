import { ErrorParser }  from './error-parser';

if (!process.env.NO_TRACE_MAPPING) {
    ErrorParser.monkeyPatchGlobalError();
}
