import { type Sade } from 'sade'
import {
    buildClientSchema,
    getIntrospectionQuery,
    printSchema,
} from "graphql";
import { loadConfig } from "graphql-config";
import { post } from "httpie";
import { cyan, magenta } from "kleur/colors";
import { writeFile } from 'swrt';

interface Endpoint {
    url: string;
    headers: Record<string, string>;
}

const introspection_query = getIntrospectionQuery();

async function get_schema_payload(endpoint: Endpoint) {
    let { data } = await post(endpoint.url, {
        headers: endpoint.headers,
        body: JSON.stringify({
            operationName: "IntrospectionQuery",
            query: introspection_query,
        }),
    });

    if (typeof data === "string")
        data = JSON.parse(data);

    return data?.data;
}

export default (prog: Sade) => {
    prog
        .command('schema', "Fetch a schema using graphql-tools config files", { default: true })
        .option('-e, --endpoint', "The endpoint to use", "next")
        .option('--json', "Output the schema as json", false)
        .action(async (options) => {
            const config = await loadConfig({
                rootDir: process.cwd(),

            });

            if (!config) throw new Error('config not discovered');

            for (const [, project] of Object.entries(config.projects)) {
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

                    const schema_text = `# Endpoint: ${endpoint.url
                        }\n# Fetched at ${new Date().toISOString()}\n\n${printSchema(schema)}`;

                    await writeFile(project.schema as string, schema_text, "utf8");
                }

                console.log("Processed [%s] schema %s", project.name, endpoint.url);
            }
        })
}