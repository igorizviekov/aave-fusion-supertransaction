import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const USDC_ABI = [
	'function transfer(address to, uint256 amount) returns (bool)',
	'function balanceOf(address account) view returns (uint256)',
	'function decimals() view returns (uint8)',
] as const;
const USDC_ADDRESS = process.env.USDC_ADDRESS;
const TEST_ADDRESS = process.env.TEST_ADDRESS;
const USDC_WHALE_ADDRESS = process.env.USDC_WHALE_ADDRESS;

async function fundAccount(): Promise<void> {
	if (!USDC_ADDRESS || !TEST_ADDRESS || !USDC_WHALE_ADDRESS) {
		throw new Error(
			'USDC_ADDRESS, TEST_ADDRESS, or USDC_WHALE_ADDRESS is not set'
		);
	}
	try {
		const provider = new ethers.JsonRpcProvider(process.env.LOCAL_RPC_URL);
		const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

		console.log('Impersonating USDC whale...');

		await provider.send('anvil_impersonateAccount', [USDC_WHALE_ADDRESS]);

		console.log('Funding whale with ETH for gas...');
		await provider.send('anvil_setBalance', [
			USDC_WHALE_ADDRESS,
			'0x1000000000000000000',
		]);
		const whaleBalance = await usdcContract.balanceOf(USDC_WHALE_ADDRESS);
		console.log(
			`Whale USDC balance: ${ethers.formatUnits(whaleBalance, 6)} USDC`
		);

		const currentBalance = await usdcContract.balanceOf(TEST_ADDRESS);
		console.log(
			`Test account current USDC balance: ${ethers.formatUnits(
				currentBalance,
				6
			)} USDC`
		);

		const transferAmount: bigint = ethers.parseUnits('1000000', 6);

		console.log(`Transferring 1,000,000 USDC to test account...`);

		const whaleSigner = await provider.getSigner(USDC_WHALE_ADDRESS);
		const usdcContractWithSigner = usdcContract.connect(whaleSigner);
		const transferFunction = usdcContractWithSigner.getFunction('transfer');
		const transferTx = await transferFunction(TEST_ADDRESS, transferAmount, {
			gasLimit: 100000,
		});

		await transferTx.wait();

		const newBalance = await usdcContract.balanceOf(TEST_ADDRESS);
		console.log(
			`Test account new USDC balance: ${ethers.formatUnits(newBalance, 6)} USDC`
		);

		console.log('Account funded successfully.');
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error funding account:', error.message);
		} else {
			console.error('Error funding account:', error);
		}
		process.exit(1);
	}
}

fundAccount();
