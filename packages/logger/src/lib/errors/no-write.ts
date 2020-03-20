export class NoWriteFunctionError extends Error {
    message = "Logger has no 'write' function set.";
}