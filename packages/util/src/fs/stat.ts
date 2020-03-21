import * as fs from 'fs';

export function stat(path: fs.PathLike): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) { return reject(err); }

            resolve(stats);
        });
    });
} 