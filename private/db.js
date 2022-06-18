const { MongoClient } = require('mongodb');

const uri = process.env.TICKETEER_DB;
const client = new MongoClient(uri);

client.addListener('error', (err) => {
	console.error(`[MongoDB] Error ${err.name}: ${err.message}`);
	client.connect(uri);
});

client.addListener('connectionReady', () => {
	console.log('[MongoDB] Connection ready!');
});

module.exports = {
	/**
	 * Get's the static MongoDB instance
	 * @return {MongoClient}
	 */
	getInstance() {
		return client;
	},
};
