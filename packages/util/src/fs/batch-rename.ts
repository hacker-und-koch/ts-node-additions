import * as fs from 'fs';
import { filesIn } from '.';
import * as path from 'path';

export async function batchRename(directory: fs.PathLike, replace: RegExp, by: string): Promise<string[][]> {
    const input_files = await filesIn(directory);

    // console.log(input_files);

    const movements: string[][] = await input_files
        .map(file => {
            const info = path.parse(file);

            if (!replace.test(info.name)) {
                return null;
            }

            info.name = info.name.replace(replace, by);
            info.base = info.base.replace(replace, by);

            console.log(info);

            const out_path = path.format(info);


            return [
                file,
                out_path
            ]

        })
        .filter(x => x);

    for (let movement of movements) {
        console.log("RENAMING", movement);
        await rename(movement[0], movement[1]);
    }

    return movements;
}

export function rename(path: fs.PathLike, newpath: fs.PathLike): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.rename(path, newpath, err =>
            err ?
                reject(err) :
                resolve()
        );
    });
}