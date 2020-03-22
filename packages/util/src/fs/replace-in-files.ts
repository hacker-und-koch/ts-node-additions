import * as fs from 'fs';
import { filesIn } from './files-in';
import { read } from './read';
import { write } from './write';

export async function replaceInFiles(directory: fs.PathLike, replace: RegExp, by: string): Promise<void> {
    const files = await filesIn(directory);

    for (let file of files) {
        const content = await read(file);

        const modified = content.toString().replace(replace, by);

        await write(file, modified);
    }
}

