#!/usr/bin/env node

import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import { loadConfigSync } from "graphql-config";
import { post } from "httpie";
import { cyan, green, magenta } from "kleur/colors";

import sade from "sade";
import { writeFile } from "swrt";

const { version, name } = require("fgs/package.json");

// ~> schema_handler
// TODO: Until bundt@next — lets inline this

interface Endpoint {
	url: string;
	headers: Record<string, string>;
}

async function call_graphql(endpoint: Endpoint, query: string) {
	let { data } = await post(endpoint.url, {
		headers: endpoint.headers,
		body: JSON.stringify({
			query: query,
		}),
	});

	if (typeof data === "string") data = JSON.parse(data);

	if (Array.isArray(data?.errors))
		throw new Error(JSON.stringify(data.errors, null, 4));

	return data.data;
}

async function schema_handler(options: { json: boolean; endpoint: string }) {
	const introspection_query = getIntrospectionQuery();

	const config = loadConfigSync({
		rootDir: process.cwd(),
	});

	if (!config) throw new Error("config not discovered");

	for (const [, project] of Object.entries(config.projects)) {
		if (!project.hasExtension("endpoints"))
			throw new Error(
				`Project ${cyan(project.name)} could not find ${magenta(
					`endpoints`
				)} extension.`
			);

		const endpoints =
			project.extension<Record<string, Endpoint>>("endpoints");
		if (!(options.endpoint in endpoints))
			throw new Error(
				`Project ${cyan(project.name)} does not have ${magenta(
					options.endpoint
				)} endpoint.`
			);

		const endpoint = endpoints[options.endpoint];

		const schema_payload = await call_graphql(
			endpoint,
			introspection_query
		);

		if (options.json) {
			await writeFile(
				`${project.schema}.json`,
				JSON.stringify(schema_payload, null, 4),
				"utf8"
			);
		} else {
			const schema = buildClientSchema(schema_payload);

			const schema_text = `# Endpoint: ${
				endpoint.url
			}\n# Fetched at ${new Date().toISOString()}\n\n${printSchema(
				schema
			)}`;

			await writeFile(project.schema as string, schema_text, "utf8");
		}

		console.log(
			`🎉 Fetched ${cyan("%s")} [${green("%s")}] schema from ${magenta(
				"%s"
			)}`,
			project.name,
			options.endpoint,
			endpoint.url
		);
	}
}

// ~> cli runtime

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
