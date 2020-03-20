import * as fs from 'fs';

export function write(file: fs.PathLike, content: Buffer | string, options?: { encoding?: string, flags?: string }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(file, content, options || {}, (err) =>
            err ? reject(err) : resolve()
        );
    });
}
