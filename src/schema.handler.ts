import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import { loadConfigSync } from "graphql-config";
import { post } from "httpie";
import { cyan, green, magenta } from "kleur/colors";

import { writeFile } from "swrt";

const headers_map = (headers: Record<string, string>) => {
	const returns = new Map();
	if (headers != undefined)
		for (let head_key of Object.keys(headers))
			returns.set(head_key.toLowerCase(), headers[head_key]);
	return returns;
};

interface Endpoint {
	url: string;
	headers: Record<string, string>;
}

async function call_graphql(endpoint: Endpoint, query: string) {
	const headers = headers_map(endpoint.headers);
	if (!headers.has("content-type"))
		headers.set("content-type", "application/graphql+json");

	let { data } = await post(endpoint.url, {
		headers: Object.fromEntries(headers),
		body: JSON.stringify({
			query: query,
		}),
	});

	if (typeof data === "string") data = JSON.parse(data);

	if (Array.isArray(data?.errors))
		throw new Error(JSON.stringify(data.errors, null, 4));

	return data.data;
}

export async function handler(options: { json: boolean; endpoint: string }) {
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
