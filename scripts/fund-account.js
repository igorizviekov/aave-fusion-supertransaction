#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

async function fundAccount() {
	try {
		const provider = new ethers.JsonRpcProvider(process.env.LOCAL_RPC_URL);
		const usdcAbi = [
			'function transfer(address to, uint256 amount) returns (bool)',
			'function balanceOf(address account) view returns (uint256)',
			'function decimals() view returns (uint8)',
		];

		const usdcContract = new ethers.Contract(
			process.env.USDC_ADDRESS,
			usdcAbi,
			provider
		);

		const testAddress = process.env.TEST_ADDRESS;
		const whaleAddress = process.env.USDC_WHALE_ADDRESS;

		console.log('Impersonating USDC whale...');

		await provider.send('anvil_impersonateAccount', [whaleAddress]);

		console.log('Funding whale with ETH for gas...');
		await provider.send('anvil_setBalance', [
			whaleAddress,
			'0x1000000000000000000',
		]);
		const whaleBalance = await usdcContract.balanceOf(whaleAddress);
		console.log(
			`Whale USDC balance: ${ethers.formatUnits(whaleBalance, 6)} USDC`
		);

		const currentBalance = await usdcContract.balanceOf(testAddress);
		console.log(
			`Test account current USDC balance: ${ethers.formatUnits(
				currentBalance,
				6
			)} USDC`
		);

		const transferAmount = ethers.parseUnits('1000000', 6);

		console.log(`Transferring 1,000,000 USDC to test account...`);

		const whaleSigner = await provider.getSigner(whaleAddress);
		const usdcContractWithSigner = usdcContract.connect(whaleSigner);
		const transferTx = await usdcContractWithSigner.transfer(
			testAddress,
			transferAmount,
			{
				gasLimit: 100000,
			}
		);

		await transferTx.wait();

		const newBalance = await usdcContract.balanceOf(testAddress);
		console.log(
			`Test account new USDC balance: ${ethers.formatUnits(newBalance, 6)} USDC`
		);

		console.log('Account funded successfully.');
	} catch (error) {
		console.error('Error funding account:', error.message);
		process.exit(1);
	}
}

fundAccount();
