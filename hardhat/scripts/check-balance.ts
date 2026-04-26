import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`\nAddress: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
