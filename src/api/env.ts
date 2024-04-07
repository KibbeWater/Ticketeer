import { z } from 'zod';
import 'dotenv/config';

const envShape = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']),

	DATABASE_URL: z.string().url(),
	DIRECT_URL: z.string().url(),
	DISCORD_TOKEN: z.string(),
	PREFIX: z.string().default('!'),
	OWNER_ID: z.string(),
});

export const _envCheck = () => {
	const _env = envShape.safeParse(process.env);
	if (!_env.success) throw new Error(`Invalid environment variables: ${_env.error.issues[0].path}`);
};

export const env = envShape.parse(process.env);
