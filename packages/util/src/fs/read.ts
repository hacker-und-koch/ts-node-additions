import * as fs from 'fs';

export function read(file: fs.PathLike, options?: { encoding?: string, flags?: string }): Promise<string | Buffer> {
    return new Promise<string | Buffer>((resolve, reject) => {
        fs.readFile(file, options || {}, (err, data) =>
            err ? reject(err) : resolve(data)
        );
    });
}
