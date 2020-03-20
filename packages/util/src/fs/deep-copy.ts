import * as fs from 'fs';
import * as path from 'path';

export function deepCopy(source: string, target: string) {
    if (!fs.existsSync(source)) {
        throw new Error(`"${source}" is not a file`);
    }
    if (!fs.statSync(source).isDirectory()) {
        throw new Error(`"${source}" is not a directory`);
    }

    fs.mkdirSync(target);

    const content = fs.readdirSync(source)
        .map(fname => ({
            fname: fname,
            sourcePath: path.join(source, fname),
            targetPath: path.join(target, fname),
            stat: fs.statSync(path.join(source, fname))
        }));

    for (let pkg of content) {
        if (pkg.stat.isDirectory()) {
            deepCopy(pkg.sourcePath, path.join(target, pkg.fname));
        } else {
            fs.copyFileSync(pkg.sourcePath, pkg.targetPath);
        }
    }
}
