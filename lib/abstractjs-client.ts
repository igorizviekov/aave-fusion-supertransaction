import {
	createMeeClient,
	toMultichainNexusAccount,
	getMEEVersion,
	MEEVersion,
} from '@biconomy/abstractjs';
import type { MeeClient, Url } from '@biconomy/abstractjs';
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY as `0x${string}`;
const MEE_NODE_URL = process.env.MEE_NODE_URL as Url;
const LOCAL_RPC_URL = process.env.LOCAL_RPC_URL;

let meeClient: MeeClient | null = null;

export async function getMeeClient(): Promise<MeeClient> {
	if (meeClient) {
		return meeClient;
	}
	if (!TEST_PRIVATE_KEY || !MEE_NODE_URL || !LOCAL_RPC_URL) {
		throw new Error('Missing required environment variables');
	}
	const eoa = privateKeyToAccount(TEST_PRIVATE_KEY);

	const orchestrator = await toMultichainNexusAccount({
		chainConfigurations: [
			{
				chain: mainnet,
				transport: http(process.env.LOCAL_RPC_URL),
				version: getMEEVersion(MEEVersion.V2_1_0),
			},
		],
		signer: eoa,
	});

	meeClient = await createMeeClient({
		account: orchestrator,
		url: MEE_NODE_URL,
		apiKey: process.env.BICONOMY_API_KEY,
	});

	return meeClient;
}

export function resetMeeClient(): void {
	meeClient = null;
}

export async function getAccountAddress(): Promise<string> {
	if (meeClient) {
		const address = meeClient.account.addressOn(1);
		if (address) {
			return address;
		}
	}
	const client = await getMeeClient();
	const address = client.account.addressOn(1);
	if (!address) {
		throw new Error('Could not get account address');
	}
	return address;
}

export function isMeeClientInitialized(): boolean {
	return meeClient !== null;
}
