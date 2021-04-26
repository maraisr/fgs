import { diary } from "diary";
import { mkdir, writeFile } from "fs/promises";
import {
	buildClientSchema,
	getIntrospectionQuery,
	GraphQLSchema,
	printSchema,
} from "graphql";
import { loadConfig } from "graphql-config";
import { post } from "httpie";
import { cyan, magenta } from "kleur/colors";
// @ts-ignore
import mri from "mri";
import { dirname } from "path";

interface Endpoint {
	url: string;
	headers: Record<string, string>;
}

const { log } = diary("fgs");

const cli_opts = mri(process.argv.slice(2), {
	default: {
		endpoint: "next",
	},
	string: ["endpoint"],
	alias: {
		endpoint: ["e"],
	},
});

const introspection_query = getIntrospectionQuery();

const schema_cache = new Map<string, GraphQLSchema>();

async function get_schema(endpoint: Endpoint) {
	const maybe_schema = schema_cache.get(endpoint.url);
	if (maybe_schema) {
		log("reusing schema for %s", endpoint.url);
		return maybe_schema;
	}

	log("fetching schema from %s", endpoint.url);

	let { data } = await post(endpoint.url, {
		headers: endpoint.headers,
		body: JSON.stringify({
			operationName: "IntrospectionQuery",
			query: introspection_query,
		}),
	});

	// @ts-ignore
	data = JSON.parse(data);

	const schema = buildClientSchema(data.data, {
		assumeValid: true,
	});

	schema_cache.set(endpoint.url, schema);

	return schema;
}

async function run(options: { endpoint: string }) {
	log("starting with config %j", options);
	const config = await loadConfig({});

	log("config discovered at %s", config.filepath);

	for (const [, project] of Object.entries(config.projects)) {
		log("processing project %s", project.name);
		if (!project.hasExtension("endpoints"))
			throw new Error(
				`Project ${cyan(project.name)} could not find ${magenta(
					`endpoints`
				)} extension.`
			);

		const endpoints = project.extension<Record<string, Endpoint>>(
			"endpoints"
		);
		if (!(options.endpoint in endpoints))
			throw new Error(
				`Project ${cyan(project.name)} does not have ${magenta(
					options.endpoint
				)} endpoint.`
			);

		const endpoint = endpoints[options.endpoint];

		const schema = await get_schema(endpoint);

		const schema_text = `# Endpoint: ${
			endpoint.url
		}\n# Fetched at ${new Date().toISOString()}\n\n${printSchema(schema)}`;

		await mkdir(dirname(project.schema as string), { recursive: true });
		await writeFile(project.schema as string, schema_text, "utf8");
	}
}

run(cli_opts).catch((e) => {
	console.error(e);
	process.exit(1);
});
