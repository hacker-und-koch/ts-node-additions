const { resolve: resolvePath } = require('path');
const { workspaces: WORKSPACES } = require(resolvePath(__dirname, 'package.json'));
const { spawn } = require('child_process');
const { platform } = require('os');

const DEBUG = true;
const IS_WINDOWS = platform().indexOf('win') > -1;

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
    .then(command => console.log(`Done ${command}ing.`));

async function run(argv, debug) {
    console.debug = (...args) => debug ? console.log(...args) : null;

    if (await yarn(['--help'], undefined, true) !== 0) {
        throw new Error(`Please install 'yarn'.`);
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
        case "spread-version":
            await spreadVersion();
    }

    return command;



    async function build(workspaces) {
        return runYarn('build', workspaces);
    }

    async function test(workspaces) {
        return runYarn('test', workspaces);
    }

    async function install() {
        return yarn(['install'], process.cwd());
    }

    async function runYarn(args, workspaces = [...WORKSPACES]) {
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
            if (await yarn(args, workspace) !== 0) {
                throw new Error(`Yarn exited with non-zero code in ${workspace}.`);
            }
        }
    }

    function yarn(args, cwd = process.cwd(), nolog = false) {
        args = [...args];

        let cmd = 'yarn';

        if (IS_WINDOWS) {
            args.unshift('yarn');
            args.unshift('/c');

            cmd = process.env.comspec;
        }

        return new Promise((resolve, reject) => {
            console.debug(`Spawning ${cmd}`, args);
            const proc = spawn(cmd, args, {
                cwd,
                stdio: 'pipe',
            });

            if (!nolog) {
                proc.stdout.on('data', d => process.stdout.write(d));
                proc.stderr.on('data', d => process.stderr.write(d));
            }

            proc.on('error', reject);
            proc.on('exit', resolve);
        });
    }
}

