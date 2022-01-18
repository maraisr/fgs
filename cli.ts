import sade from 'sade';

import defineRelay from './src/relay'
import defineSchema from './src/schema';

const prog = sade('fgs');

defineSchema(prog);
defineRelay(prog);

const result = prog.parse(process.argv);

// @ts-expect-error
if (result && 'then' in result)
	// @ts-expect-error
	result.catch((e) => {
		console.error(e);
		process.exit(1);
	});
