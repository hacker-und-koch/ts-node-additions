const { resolve: resolvePath } = require('path');
const { workspaces: WORKSPACES, version: VERSION } = require(resolvePath(__dirname, 'package.json'));
const { spawn } = require('child_process');
const { createInterface: createRlInterface } = require('readline');
const { platform } = require('os');
const { writeFile } = require('fs');

const DEBUG = true;
const IS_WINDOWS = /^win[36][24]$/.test(platform());

if (IS_WINDOWS) {
    console.debug('Detected Windows.');
}

run(process.argv, DEBUG)
    .catch(e => {
        if (DEBUG) {
            throw e;
        } else {
            console.error(e.message);
            process.exit(1);
        }
    })
    .then(() => console.log(`.run.js exiting cleanly.`));

async function run(argv, debug) {
    console.debug = (...args) => debug ? console.log(...args) : null;

    if (await yarn(['--version']) !== 0) {
        throw new Error(`Please install 'yarn'.`);
    }
    if (await git(['--version']) !== 0) {
        throw new Error(`Please install 'git'.`);
    }

    // remove exec-path
    argv.splice(0, 2);

    const command = argv.shift();

    switch (command) {
        case undefined:
            break;
        case "setup":
            await install();
            await build();
            await test();
            break;
        case "build":
            await build(argv.map(arg => `packages/${arg}`));
            break;
        case "test":
            await test(argv.map(arg => `packages/${arg}`));
            break;
        case "version":
            await version();
            break;
        case "release":
            await release();
            break;
    }

    return command;
    async function install() {
        return yarn(['install']);
    }

    async function build(workspaces) {
        return runCommandInWorkspaces('yarn', 'build', workspaces);
    }

    async function test(workspaces) {
        return runCommandInWorkspaces('yarn', 'test', workspaces);
    }

    async function version() {
        console.log('++ determining new version');
        const newVersion = await getVersion(argv[0]);

        console.log('++ checking out release branch');
        // await git(['checkout', 'release']);
        console.log('++ merging master branch')
        // await git(['merge', '--no-ff', '-m', `'release: ${newVersion}'`, 'master']);

        console.log('++ spreading version to packages');
        await spreadVersionToDependencies(newVersion);

        console.log('++ commiting and pushing changes');
        await yarn(['version', '--new-version', newVersion]);
    }

    async function release() {
        await runCommandInWorkspaces('npm', ['publish', '--access', 'public']);
    }

    async function runCommandInWorkspaces(command, args, workspaces = [...WORKSPACES]) {
        if (!Array.isArray(args)) {
            args = [args];
        }
        if (!workspaces.length) {
            workspaces = [...WORKSPACES];
        }

        const unknownWorkspace = workspaces.find(pkg => WORKSPACES.indexOf(pkg) < 0);

        if (unknownWorkspace) {
            throw new Error(`Cannot run ${args[0]} in ${unknownWorkspace}. It's not a known workspace.`);
        }

        console.debug(`Running ${args[0]} in order:`, workspaces);

        for (let workspace of workspaces) {
            console.log(`> Running ${args[0]} in ${workspace}`);
            if (await runCommand(command, args, workspace) !== 0) {
                throw new Error(`Yarn exited with non-zero code in ${workspace}.`);
            }
        }
    }

    function yarn(args, cwd = process.cwd()) {
        return runCommand('yarn', args, cwd);
    }

    function git(args, cwd = process.cwd()) {
        return runCommand('git', args, cwd);
    }

    function npm(args, cwd = process.cwd()) {
        return runCommand('npm', args, cwd);
    }

    function runCommand(cmd, args = [], cwd = process.cwd()) {
        args = [...args];

        if (IS_WINDOWS) {
            args.unshift(cmd);
            args.unshift('/c');

            cmd = process.env.comspec;
        }

        return new Promise((resolve, reject) => {
            // console.debug(`Spawning ${cmd}`, args);
            const proc = spawn(cmd, args, {
                cwd,
                shell: true,
                stdio: 'pipe',
            });

            proc.stdout.on('data', d => process.stdout.write(d));
            proc.stderr.on('data', d => process.stderr.write(d));

            proc.on('error', reject);
            proc.on('exit', resolve);
        });
    }


    async function getVersion(increase) {
        console.log(`Current version is ${VERSION}.`)
        let validAnswer = increase;

        while (!validAnswer) {
            const answer = await question(`Please select 'major', 'minor' or 'patch': `);
            console.debug(`> Answer:`, answer);
            if (/(major|minor|patch)/.test(answer)) {
                validAnswer = answer;
            } else {
                console.log(`Not a valid answer.`);
            }
        }
        const newVersion = raiseVersion(VERSION, validAnswer);
        console.log(`This results in jump from >> ${VERSION} << to >> ${newVersion} <<.`);

        const yN = increase ? 'y' : await yesNo(`Continue with ${newVersion}?`);

        if (yN === 'n') {
            throw new Error('User aborted.');
        }

        return newVersion;
    }

    function question(text) {
        return new Promise((resolve) => {
            const rl = createRlInterface(process.stdin, process.stdout);
            rl.question(text, (resp) => {
                resolve(resp);
                rl.close();
            });
        });
    }

    async function yesNo(text) {
        let validAnswer;
        while (!validAnswer) {
            const answer = await question(`${text} [ynYN]: `);
            console.debug(`> Answer:`, answer);
            if (/([ynYN])/.test(answer)) {
                validAnswer = answer.toLowerCase();
            } else {
                console.log(`Not a valid answer.`);
            }
        }
        return validAnswer;
    }

    async function spreadVersionToDependencies(version) {
        return Promise.all(
            WORKSPACES.map(workspace => applyVersionToWorkspaceDependencies(workspace, version))
        );
    }

    function applyVersionToWorkspaceDependencies(workspace, version) {
        return new Promise((resolve, reject) => {
            const packageJsonPath = resolvePath(__dirname, workspace, 'package.json');

            const packageJson = require(packageJsonPath);

            for (let name of Object.keys((packageJson.dependencies || {}))) {
                if (/@hacker-und-koch\/.+/.test(name)) {
                    packageJson.dependencies[name] = version;
                }
            }

            packageJson.version = version;

            writeFile(packageJsonPath, JSON.stringify(packageJson, null, 4), err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }


    function raiseVersion(current, level) {
        let [
            major,
            minor,
            patch
        ] = current
            .split('.')
            .map(s => Number(s));

        switch (level) {
            case "major":
                major += 1;
                break;
            case "minor":
                minor += 1;
                break;
            case "patch":
                patch += 1;
                break;
        }
        return [major, minor, patch].join('.');
    }
}
