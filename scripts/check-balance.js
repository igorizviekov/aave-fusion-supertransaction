#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

async function checkBalance() {
	try {
		const provider = new ethers.JsonRpcProvider(process.env.LOCAL_RPC_URL);

		const usdcAbi = [
			'function balanceOf(address account) view returns (uint256)',
			'function decimals() view returns (uint8)',
			'function symbol() view returns (string)',
		];

		const usdcContract = new ethers.Contract(
			process.env.USDC_ADDRESS,
			usdcAbi,
			provider
		);

		const testAddress = process.env.TEST_ADDRESS;

		console.log(`Checking balances for address: ${testAddress}`);
		console.log('─'.repeat(60));

		const ethBalance = await provider.getBalance(testAddress);
		console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

		const usdcBalance = await usdcContract.balanceOf(testAddress);
		const usdcDecimals = await usdcContract.decimals();
		const usdcSymbol = await usdcContract.symbol();
		console.log(
			`${usdcSymbol} Balance: ${ethers.formatUnits(
				usdcBalance,
				usdcDecimals
			)} ${usdcSymbol}`
		);

		try {
			const ausdcAbi = [
				'function balanceOf(address account) view returns (uint256)',
				'function decimals() view returns (uint8)',
				'function symbol() view returns (string)',
			];

			const ausdcContract = new ethers.Contract(
				process.env.AUSDC_ADDRESS,
				ausdcAbi,
				provider
			);

			const ausdcBalance = await ausdcContract.balanceOf(testAddress);
			const ausdcDecimals = await ausdcContract.decimals();
			const ausdcSymbol = await ausdcContract.symbol();
			console.log(
				`${ausdcSymbol} Balance: ${ethers.formatUnits(
					ausdcBalance,
					ausdcDecimals
				)} ${ausdcSymbol}`
			);
		} catch (error) {
			console.log(
				'aUSDC Balance: Not available (contract may not exist or not deployed)'
			);
		}

		console.log('─'.repeat(60));
		console.log('Balance check complete.');
	} catch (error) {
		console.error('Error checking balance:', error.message);
		process.exit(1);
	}
}

checkBalance();
