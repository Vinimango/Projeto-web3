import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  const tokenAddress = addresses.TOKEN;

  const [deployer] = await ethers.getSigners();
  const BananaToken = await ethers.getContractAt("BananaToken", tokenAddress);

  const balance = await BananaToken.balanceOf(deployer.address);
  console.log(`\nAddress: ${deployer.address}`);
  console.log(`BANANA Balance: ${ethers.formatUnits(balance, 18)} BANANA\n`);
  
  const totalSupply = await BananaToken.totalSupply();
  console.log(`Total Supply: ${ethers.formatUnits(totalSupply, 18)} BANANA`);
  
  const daoBalance = await BananaToken.balanceOf(addresses.DAO);
  console.log(`DAO Balance: ${ethers.formatUnits(daoBalance, 18)} BANANA\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
