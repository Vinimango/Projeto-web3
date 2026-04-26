import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ Arquivo deployed-addresses.json não encontrado. Faça o deploy primeiro.");
    return;
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  const tokenAddress = addresses.TOKEN;

  if (!tokenAddress) {
    console.error("❌ Endereço do token não encontrado no arquivo.");
    return;
  }

  const [deployer] = await ethers.getSigners();
  const BananaToken = await ethers.getContractAt("BananaToken", tokenAddress);

  // Pega o endereço de destino do argumento da linha de comando
  const targetAddress = process.argv[2];

  if (!targetAddress || !ethers.isAddress(targetAddress)) {
    console.log("\n📖 Uso: npx hardhat run scripts/faucet.ts --network localhost <endereco_da_carteira>");
    console.log("\nExemplo: npx hardhat run scripts/faucet.ts --network localhost 0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n");
    
    console.log("Saldos atuais do Deployer:");
    const balance = await BananaToken.balanceOf(deployer.address);
    console.log(`- BANANA: ${ethers.formatUnits(balance, 18)}`);
    return;
  }

  const amount = ethers.parseUnits("1000", 18); // 1000 tokens por faucet

  console.log(`\n🚰 Enviando 1000 BANANA para ${targetAddress}...`);
  
  const tx = await BananaToken.transfer(targetAddress, amount);
  await tx.wait();

  console.log("✅ Sucesso!");
  
  const targetBalance = await BananaToken.balanceOf(targetAddress);
  console.log(`Novo saldo de ${targetAddress}: ${ethers.formatUnits(targetBalance, 18)} BANANA\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
