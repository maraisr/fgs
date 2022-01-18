import globby from 'globby';
import * as path from 'path';
import * as fs from 'fs/promises';
import { type Sade } from "sade";
import { klona } from 'klona';
import { writeFile } from 'swrt';

import { bold, cyan, italic } from 'kleur/colors'

const inherits_cache = new Map();

const disdover_projects = async (source: string, config_name: string) => {
    const projects = await globby(`**/${config_name}`, {
        cwd: source,
        unique: true,
        onlyFiles: true,
        gitignore: true,
        ignore: ['**/node_modules/**'],
    });

    return Promise.all(projects
        .map(async (config_file) => {
            const abs = path.resolve(source, config_file); // /users/project/workspace/a/relay.json
            const rel = path.relative(source, path.dirname(abs)); // workspace/a
            let config = JSON.parse(await fs.readFile(abs, 'utf8')); // {}

            if (config.inherits) {
                const inherits_path = path.resolve(path.dirname(abs), config.inherits);
                let maybe_base = inherits_cache.get(inherits_path);
                if (!maybe_base) {
                    maybe_base = JSON.parse(await fs.readFile(inherits_path, 'utf8'));
                    inherits_cache.set(inherits_path, maybe_base);
                }

                config = {
                    ...klona(maybe_base),
                    ...config
                }

                delete config.inherits;
            }

            return {
                file: config_file,
                abs,
                rel,
                config
            }
        }))
}

export default (prog: Sade) => {
    prog
        .command('relay <target>', "Build and construct relay.json")
        .option('--base', "The path to the target relay.json file", "relay.base.json")
        .action(async (target, { base }) => {
            const cwd = process.cwd();

            const config = JSON.parse(await fs.readFile(path.resolve(cwd, base), 'utf8'));

            const root = path.resolve(cwd, config.root);

            config.sources = {};
            config.projects = {};

            for (let project of await disdover_projects(root, 'relay.json')) {
                const name = project.config.name || path.dirname(project.file);
                delete project.config.name;

                config.sources[project.rel] = name;
                config.projects[name] = project.config;

                console.log(`${cyan(bold(italic(name)))} sourced~!`);
            }

            writeFile(path.resolve(cwd, target), JSON.stringify(config, null, 4));
        })
}