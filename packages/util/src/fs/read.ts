import * as fs from 'fs';
import { readFile } from 'fs/promises';

export function read(file: fs.PathLike, options?: { encoding?: BufferEncoding, flags?: string | number }): Promise<string | Buffer> {
    console.warn('!! async file read in util will be deprecated !! Use readFile of fs/promises instead.');
    return readFile(file, options);
}
