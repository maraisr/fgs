#!/usr/bin/env node

import sade from "sade";
import { handler as schema_handler } from "./schema.handler";

const { version, name } = require("fgs/package.json");

const prog = sade(name, true);

prog.describe(
	"fetches a graphql schema based on configuration from graphql-config files"
)
	.version(version)
	.example("-e dev # fetches the development defined in `extensions.dev`");

prog
	//.command('schema')
	.option("-e, --endpoint", "the endpoint to use", "next")
	.option("--json", "output the schema as json", false)
	.action(schema_handler);

const result = prog.parse(process.argv);

// @ts-ignore
if ("then" in result) {
	(result as unknown as Promise<never>).catch((e) => {
		console.error(e);
		process.exit(1);
	});
}
