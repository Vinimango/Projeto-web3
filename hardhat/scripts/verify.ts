import { run } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ Arquivo deployed-addresses.json não encontrado. Faça o deploy primeiro.");
    return;
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));

  if (addresses.network !== "sepolia") {
    console.warn("⚠️  Atenção: Os endereços salvos não parecem ser da Sepolia (Rede atual: " + addresses.network + ").");
    console.log("Para verificar, você precisa ter feito o deploy na rede Sepolia.");
    return;
  }

  console.log("🔍 Iniciando verificação dos contratos no Etherscan...\n");

  try {
    // 1. BananaToken (Sem argumentos no construtor)
    console.log("Verificando BananaToken...");
    await run("verify:verify", {
      address: addresses.TOKEN,
      constructorArguments: [],
    });
  } catch (e: any) {
    console.log(`❌ Erro ao verificar BananaToken: ${e.message}`);
  }

  try {
    // 2. BetTicket (Sem argumentos no construtor)
    console.log("\nVerificando BetTicket...");
    await run("verify:verify", {
      address: addresses.NFT,
      constructorArguments: [],
    });
  } catch (e: any) {
    console.log(`❌ Erro ao verificar BetTicket: ${e.message}`);
  }

  try {
    // 3. MonkeyStaking (Argumentos: tokenAddress, chainlinkAddress)
    console.log("\nVerificando MonkeyStaking...");
    await run("verify:verify", {
      address: addresses.STAKING,
      constructorArguments: [addresses.TOKEN, addresses.CHAINLINK_ETH_USD],
    });
  } catch (e: any) {
    console.log(`❌ Erro ao verificar MonkeyStaking: ${e.message}`);
  }

  try {
    // 4. MonkeyDAO (Argumentos: tokenAddress)
    console.log("\nVerificando MonkeyDAO...");
    await run("verify:verify", {
      address: addresses.DAO,
      constructorArguments: [addresses.TOKEN],
    });
  } catch (e: any) {
    console.log(`❌ Erro ao verificar MonkeyDAO: ${e.message}`);
  }

  console.log("\n✅ Processo de verificação concluído!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
