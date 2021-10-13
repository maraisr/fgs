import { diary } from "diary";
import {
	buildClientSchema,
	getIntrospectionQuery,
	printSchema,
} from "graphql";
import { loadConfig } from "graphql-config";
import { post } from "httpie";
import { cyan, magenta } from "kleur/colors";
import mri from "mri";
import {writeFile} from 'swrt';

interface Endpoint {
	url: string;
	headers: Record<string, string>;
}

const { log } = diary("fgs");

const cli_opts = mri<{endpoint: string, json: boolean}>(process.argv.slice(2), {
	default: {
		endpoint: "next",
		json: false
	},
	string: ["endpoint"],
	boolean: ["json"],
	alias: {
		endpoint: ["e"],
	},
});

const introspection_query = getIntrospectionQuery();

// TODO: https://github.com/graphql/graphql-spec/issues/861
const introspection_cleaner = (key, value) => {
	if (key === "description" && value === "") {
		return undefined;
	}
	return value;
};

async function get_schema_payload(endpoint: Endpoint) {
	log("fetching schema from %s", endpoint.url);

	let { data } = await post(endpoint.url, {
		headers: endpoint.headers,
		body: JSON.stringify({
			operationName: "IntrospectionQuery",
			query: introspection_query,
		}),
		reviver: introspection_cleaner,
	});

	if (typeof data === "string")
		data = JSON.parse(data, introspection_cleaner);

	return data?.data;
}

async function run(options: typeof cli_opts) {
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

		const schema_payload = await get_schema_payload(endpoint);

		if (options.json) {
			await writeFile(`${project.schema}.json`, JSON.stringify(schema_payload, null, 4), "utf8");	
		} else {
			const schema = buildClientSchema(schema_payload);

			const schema_text = `# Endpoint: ${
				endpoint.url
			}\n# Fetched at ${new Date().toISOString()}\n\n${printSchema(schema)}`;

			await writeFile(project.schema as string, schema_text, "utf8");
		}

		console.log("Processed [%s] schema %s", project.name, endpoint.url);
	}
}

run(cli_opts).catch((e) => {
	console.error(e);
	process.exit(1);
});
