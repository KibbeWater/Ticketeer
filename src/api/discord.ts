import { Client } from 'discord.js';

/**
 * Get's user from ID
 */
export async function getUser(client: Client, id: string) {
	return await client.users.fetch(id, { force: true });
}
