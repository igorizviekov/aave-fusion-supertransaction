import { ethers } from 'ethers';
import { getMeeClient, getAccountAddress } from '../lib/abstractjs-client.js';
import { getMeeScanLink } from '@biconomy/abstractjs';
import dotenv from 'dotenv';

dotenv.config();

const USDC_ADDRESS = process.env.USDC_ADDRESS! as `0x${string}`;
const AAVE_POOL_ADDRESS = process.env.AAVE_POOL_ADDRESS! as `0x${string}`;
const AUSDC_ADDRESS = process.env.AUSDC_ADDRESS! as `0x${string}`;
const EOA_ADDRESS = process.env.TEST_ADDRESS! as `0x${string}`;

const ERC20_ABI = [
	'function approve(address spender, uint256 amount) returns (bool)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function balanceOf(address account) view returns (uint256)',
	'function decimals() view returns (uint8)',
	'function symbol() view returns (string)',
] as const;

const AAVE_POOL_ABI = [
	'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
] as const;

async function executeFusionSupertransaction(): Promise<void> {
	if (!EOA_ADDRESS || !USDC_ADDRESS || !AAVE_POOL_ADDRESS || !AUSDC_ADDRESS) {
		throw new Error('Missing required environment variables');
	}

	try {
		console.log('🚀 Starting Fusion Supertransaction Execution...');

		console.log('Step 1: Initializing MEE Client...');
		const meeClient = await getMeeClient();
		const nexusAddress = await getAccountAddress();

		console.log(`EOA Address: ${EOA_ADDRESS}`);
		console.log(`Nexus Smart Account: ${nexusAddress}`);

		const provider = new ethers.JsonRpcProvider(process.env.LOCAL_RPC_URL);
		const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
		const ausdcContract = new ethers.Contract(
			AUSDC_ADDRESS,
			ERC20_ABI,
			provider
		);

		const [initialUsdc, initialAusdc] = await Promise.all([
			usdcContract.balanceOf(EOA_ADDRESS),
			ausdcContract.balanceOf(EOA_ADDRESS),
		]);

		console.log(
			`EOA USDC: ${ethers.formatUnits(
				initialUsdc,
				6
			)} | aUSDC: ${ethers.formatUnits(initialAusdc, 6)}`
		);

		const depositAmount = ethers.parseUnits('1000', 6);
		if (initialUsdc < depositAmount)
			throw new Error('Insufficient USDC balance.');

		// --- Fusion Calls ---
		const erc20Interface = new ethers.Interface(ERC20_ABI);
		const aavePoolInterface = new ethers.Interface(AAVE_POOL_ABI);

		const calls = [
			// Step 1: Transfer USDC from EOA → Nexus
			{
				to: USDC_ADDRESS,
				data: erc20Interface.encodeFunctionData('transfer', [
					nexusAddress,
					depositAmount,
				]) as `0x${string}`,
				value: 0n,
			},
			// Step 2: Approve AAVE pool to spend Nexus USDC
			{
				to: USDC_ADDRESS,
				data: erc20Interface.encodeFunctionData('approve', [
					AAVE_POOL_ADDRESS,
					depositAmount,
				]) as `0x${string}`,
				value: 0n,
			},
			// Step 3: Supply USDC → AAVE pool (mint aUSDC)
			{
				to: AAVE_POOL_ADDRESS,
				data: aavePoolInterface.encodeFunctionData('supply', [
					USDC_ADDRESS,
					depositAmount,
					nexusAddress,
					0,
				]) as `0x${string}`,
				value: 0n,
			},
			// Step 4: Transfer received aUSDC back → EOA
			{
				to: AUSDC_ADDRESS,
				data: erc20Interface.encodeFunctionData('transfer', [
					EOA_ADDRESS,
					depositAmount,
				]) as `0x${string}`,
				value: 0n,
			},
		];

		console.log('Step 2: Requesting Fusion Quote...');
		const fusionQuote = await meeClient.getFusionQuote({
			trigger: {
				chainId: 1,
				tokenAddress: USDC_ADDRESS,
				amount: depositAmount,
			},
			feeToken: { address: USDC_ADDRESS, chainId: 1 },
			instructions: [{ calls, chainId: 1 }],
		});

		console.log('Fusion quote received successfully.');

		console.log('Step 3: Executing Fusion Supertransaction...');
		const { hash } = await meeClient.executeFusionQuote({ fusionQuote });

		console.log(
			`✅ Executed Fusion Supertransaction (SINGLE TX)\nHash: ${hash}\nExplorer: ${getMeeScanLink(
				hash
			)}`
		);

		console.log('Waiting for confirmation...');
		const receipt = await meeClient.waitForSupertransactionReceipt({
			hash,
			confirmations: 1,
		});

		if (receipt.transactionStatus === 'MINED_SUCCESS') {
			console.log('🎉 Supertransaction confirmed successfully.');
		} else {
			console.warn(`⚠️ Transaction status: ${receipt.transactionStatus}`);
		}

		// --- Final Balances ---
		const [finalUsdc, finalAusdc] = await Promise.all([
			usdcContract.balanceOf(EOA_ADDRESS),
			ausdcContract.balanceOf(EOA_ADDRESS),
		]);

		console.log('--- Final Balances ---');
		console.log(
			`EOA USDC: ${ethers.formatUnits(finalUsdc, 6)} (Δ ${ethers.formatUnits(
				finalUsdc - initialUsdc,
				6
			)})`
		);
		console.log(
			`EOA aUSDC: ${ethers.formatUnits(finalAusdc, 6)} (Δ ${ethers.formatUnits(
				finalAusdc - initialAusdc,
				6
			)})`
		);
		console.log(
			'✅ Fusion Mode Supertransaction completed successfully (atomic execution).'
		);
	} catch (err) {
		console.error('❌ Fusion Supertransaction failed.');
		console.error(err instanceof Error ? err.message : err);
		console.error('\nTroubleshooting:');
		console.error('1️⃣ Ensure MEE node & Anvil are running.');
		console.error(
			'2️⃣ Fund Nexus account with ETH if gasless not supported locally.'
		);
		console.error('3️⃣ Confirm contract addresses and ABIs are correct.');
		process.exit(1);
	}
}

const isMain = process.argv[1]?.endsWith('execute-fusion-supertransaction.ts');
if (isMain) executeFusionSupertransaction();
export { executeFusionSupertransaction };
