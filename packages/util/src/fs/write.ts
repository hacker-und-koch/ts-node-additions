import * as fs from 'fs';
import { writeFile } from 'fs/promises';

export function write(file: fs.PathLike, content: Buffer | string, options?: { encoding?: BufferEncoding, flags?: string }): Promise<void> {
    console.warn('!! async file write in util will be deprecated !! Use writeFile of fs/promises instead.');
    return writeFile(file, content, options);
}
