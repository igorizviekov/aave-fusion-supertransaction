import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const USDC_ADDRESS = process.env.USDC_ADDRESS;
const TEST_ADDRESS = process.env.TEST_ADDRESS;

const USDC_ABI = [
	'function balanceOf(address account) view returns (uint256)',
	'function decimals() view returns (uint8)',
	'function symbol() view returns (string)',
] as const;
const AUSDC_ABI = [
	'function balanceOf(address account) view returns (uint256)',
	'function decimals() view returns (uint8)',
	'function symbol() view returns (string)',
] as const;

async function checkBalance(): Promise<void> {
	if (!USDC_ADDRESS || !TEST_ADDRESS) {
		throw new Error('USDC_ADDRESS or TEST_ADDRESS is not set');
	}

	try {
		const provider = new ethers.JsonRpcProvider(process.env.LOCAL_RPC_URL);
		const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

		console.log(`Checking balances for address: ${TEST_ADDRESS}`);
		console.log('─'.repeat(60));

		const ethBalance: bigint = await provider.getBalance(TEST_ADDRESS);
		console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

		const usdcBalance: bigint = await usdcContract.balanceOf(TEST_ADDRESS);
		const usdcDecimals: number = await usdcContract.decimals();
		const usdcSymbol: string = await usdcContract.symbol();
		console.log(
			`${usdcSymbol} Balance: ${ethers.formatUnits(
				usdcBalance,
				usdcDecimals
			)} ${usdcSymbol}`
		);

		try {
			const ausdcContract = new ethers.Contract(
				process.env.AUSDC_ADDRESS!,
				AUSDC_ABI,
				provider
			);

			const ausdcBalance: bigint = await ausdcContract.balanceOf(TEST_ADDRESS);
			const ausdcDecimals: number = await ausdcContract.decimals();
			const ausdcSymbol: string = await ausdcContract.symbol();
			console.log(
				`${ausdcSymbol} Balance: ${ethers.formatUnits(
					ausdcBalance,
					ausdcDecimals
				)} ${ausdcSymbol}`
			);
		} catch (error) {
			if (error instanceof Error) {
				console.log(
					'aUSDC Balance: Not available (contract may not exist or not deployed)'
				);
			}
		}
		console.log('─'.repeat(60));
		console.log('Balance check complete.');
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error checking balance:', error.message);
		} else {
			console.error('Error checking balance:', error);
		}
		process.exit(1);
	}
}

checkBalance();
