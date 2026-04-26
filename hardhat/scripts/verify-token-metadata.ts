import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  
  const token = await ethers.getContractAt("BananaToken", addresses.TOKEN);
  
  console.log("\n--- Token Details ---");
  console.log("Address:", addresses.TOKEN);
  console.log("Name:", await token.name());
  console.log("Symbol:", await token.symbol());
  console.log("Decimals:", await token.decimals());
  console.log("---------------------\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
