import { getMeeClient, getAccountAddress } from '../lib/abstractjs-client.js';
import type { MeeClient } from '@biconomy/abstractjs';
import dotenv from 'dotenv';

dotenv.config();

async function initializeAbstractJS(): Promise<MeeClient> {
	try {
		console.log('Initializing Biconomy AbstractJS SDK...');
		const meeClient = await getMeeClient();
		console.log('MEE Client initialized successfully.');
		console.log(`Connected to MEE Node: ${process.env.MEE_NODE_URL}`);

		const accountAddress = await getAccountAddress();
		console.log(`Account Address: ${accountAddress}`);

		try {
			const healthResponse = await fetch(`${process.env.MEE_NODE_URL}/info`);
			const healthData = await healthResponse.json();
			console.log('MEE Node Health Check:');
			console.log(`  - Version: ${healthData.version}`);
			console.log(`  - Node: ${healthData.node}`);
			console.log(
				`  - Status: ${
					healthData.supportedChains[0]?.healthCheck?.status || 'unknown'
				}`
			);
		} catch (error) {
			if (error instanceof Error) {
				console.warn('Could not fetch MEE node health:', error.message);
			} else {
				console.warn('Could not fetch MEE node health:', error);
			}
		}

		return meeClient;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error initializing AbstractJS SDK:', error.message);
		} else {
			console.error('Error initializing AbstractJS SDK:', error);
		}
		console.error('Make sure:');
		console.error('  1. MEE node is running: npm run start:mee');
		console.error('  2. Anvil is running: npm run start:anvil');
		console.error('  3. Environment variables are set in .env');
		process.exit(1);
	}
}

export { initializeAbstractJS };

const isMainModule =
	process.argv[1] && process.argv[1].endsWith('init-abstractjs.ts');
if (isMainModule) {
	initializeAbstractJS();
}
