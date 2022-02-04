import * as fs from 'fs';
import { stat } from './stat';;
import * as path from 'path';
import { arrflat } from '../transform';
import * as Async from '../async';
import { WSASYSNOTREADY } from 'constants';
import { resolve } from 'url';

export async function filesIn(directory: fs.PathLike, pattern?: RegExp) {

    let files = await new Promise<any[]>((resolve, reject) => {

        fs.readdir(directory, async (err, files) => {
            if (err) { return reject(err); }

            let paths = files
                .filter(fname => pattern ? pattern.test(fname) : true)
                .map(async file => {
                    const file_path = path.join(directory.toString(), file);
                    const stats = await stat(file_path);

                    if (stats.isDirectory()) {
                        return filesIn(file_path);
                    }

                    return Async.of(file_path);
                });
            // console.log("paths: ", paths);

            resolve(paths);

        });

    });


    let out = [];
    for (let prom of files) {
        out.push(await prom);
    }

    return arrflat(out);
}