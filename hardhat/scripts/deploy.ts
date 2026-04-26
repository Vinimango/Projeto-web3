import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

// ─── Chainlink Price Feed Addresses ──────────────────────────────────────────
// ETH/USD na Sepolia
const CHAINLINK_ETH_USD_SEPOLIA = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🐒 MonkeyBet Deploy iniciado na rede:", network.name);
  console.log("📬 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  let chainlinkAddress = CHAINLINK_ETH_USD_SEPOLIA;

  // Se estiver rodando localmente (hardhat node), faz deploy do MOCK
  if (network.name === "localhost" || network.name === "hardhat" || network.name === "sepolia") {
    console.log("🛠️  Rede local detectada. Deployando MockV3Aggregator...");
    const MockAgg = await ethers.getContractFactory("MockV3Aggregator");
    // Inicializa com preço simulado de $3000 (com 8 decimais)
    const mockAgg = await MockAgg.deploy(8, 3000n * 10n ** 8n);
    await mockAgg.waitForDeployment();
    chainlinkAddress = await mockAgg.getAddress();
    console.log("   ✅ MockV3Aggregator:", chainlinkAddress, "\n");
  }

  // ── 1. BananaToken ─────────────────────────────────────────────────────────
  console.log("1️⃣  Deployando BananaToken...");
  const BananaToken = await ethers.getContractFactory("BananaToken");
  const bananaToken = await BananaToken.deploy();
  await bananaToken.waitForDeployment();
  const tokenAddress = await bananaToken.getAddress();
  console.log("   ✅ BananaToken:", tokenAddress);

  // ── 2. BetTicket ───────────────────────────────────────────────────────────
  console.log("2️⃣  Deployando BetTicket...");
  const BetTicket = await ethers.getContractFactory("BetTicket");
  const betTicket = await BetTicket.deploy();
  await betTicket.waitForDeployment();
  const nftAddress = await betTicket.getAddress();
  console.log("   ✅ BetTicket:", nftAddress);

  // ── 3. MonkeyStaking ───────────────────────────────────────────────────────
  console.log("3️⃣  Deployando MonkeyStaking...");
  const MonkeyStaking = await ethers.getContractFactory("MonkeyStaking");
  const monkeyStaking = await MonkeyStaking.deploy(tokenAddress, chainlinkAddress);
  await monkeyStaking.waitForDeployment();
  const stakingAddress = await monkeyStaking.getAddress();
  console.log("   ✅ MonkeyStaking:", stakingAddress);

  // ── 4. MonkeyDAO ───────────────────────────────────────────────────────────
  console.log("4️⃣  Deployando MonkeyDAO...");
  const MonkeyDAO = await ethers.getContractFactory("MonkeyDAO");
  const monkeyDAO = await MonkeyDAO.deploy(tokenAddress);
  await monkeyDAO.waitForDeployment();
  const daoAddress = await monkeyDAO.getAddress();
  console.log("   ✅ MonkeyDAO:", daoAddress);

  // ── 5. MonkeyGame (Cara ou Coroa) ───────────────────────────────────────────
  console.log("5️⃣  Deployando MonkeyGame...");
  const MonkeyGame = await ethers.getContractFactory("MonkeyGame");
  const monkeyGame = await MonkeyGame.deploy(tokenAddress);
  await monkeyGame.waitForDeployment();
  const gameAddress = await monkeyGame.getAddress();
  console.log("   ✅ MonkeyGame:", gameAddress);

  // ── 6. MonkeySwap (ETH -> BANANA) ──────────────────────────────────────────
  console.log("6️⃣  Deployando MonkeySwap...");
  const MonkeySwap = await ethers.getContractFactory("MonkeySwap");
  const monkeySwap = await MonkeySwap.deploy(tokenAddress, chainlinkAddress);
  await monkeySwap.waitForDeployment();
  const swapAddress = await monkeySwap.getAddress();
  console.log("   ✅ MonkeySwap:", swapAddress);

  // ── 7. Configurações pós-deploy ────────────────────────────────────────────
  console.log("\n⚙️  Configurando permissões...");

  // Staking, Game e Swap podem mintar tokens de recompensa/compra
  await (await bananaToken.addMinter(stakingAddress)).wait();
  await (await bananaToken.addMinter(gameAddress)).wait();
  await (await bananaToken.addMinter(swapAddress)).wait();
  console.log("   ✅ Staking, Game e Swap adicionados como minters do BananaToken");

  // Distribuição inicial para DAO bootstrap (100k BANANA)
  const bootstrap = ethers.parseUnits("100000", 18);
  await (await bananaToken.transfer(daoAddress, bootstrap)).wait();
  console.log("   ✅ 100.000 BANANA enviados para a DAO");
  
  // Autorizar painel de apostas a mintar tickets (Para simplificar no MVP, autorizamos o dono a fazer pelo front)
  await (await betTicket.authorize(deployer.address)).wait();
  console.log("   ✅ Deployer autorizado a mintar tickets");

  // ── 6. Salvar endereços ────────────────────────────────────────────────────
  const addresses = {
    network: network.name,
    TOKEN: tokenAddress,
    NFT: nftAddress,
    STAKING: stakingAddress,
    DAO: daoAddress,
    GAME: gameAddress,
    SWAP: swapAddress,
    CHAINLINK_ETH_USD: chainlinkAddress,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  fs.writeFileSync(
    path.join(__dirname, "..", "deployed-addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n📄 Endereços salvos em deployed-addresses.json");
  console.log("\n🎉 Deploy concluído!\n");
  console.log(JSON.stringify(addresses, null, 2));

  // ── 8. Atualizar config.ts do front-end automaticamente ───────────────────
  const frontendConfigPath = path.join(
    __dirname,
    "..",
    "..",
    "monkey-bet-dao",
    "src",
    "contracts",
    "config.ts"
  );

  if (fs.existsSync(frontendConfigPath)) {
    let config = fs.readFileSync(frontendConfigPath, "utf-8");
    config = config
      .replace(/TOKEN:\s*"0x[a-fA-F0-9]+"/, `TOKEN: "${tokenAddress}"`)
      .replace(/NFT:\s*"0x[a-fA-F0-9]+"/, `NFT: "${nftAddress}"`)
      .replace(/STAKING:\s*"0x[a-fA-F0-9]+"/, `STAKING: "${stakingAddress}"`)
      .replace(/DAO:\s*"0x[a-fA-F0-9]+"/, `DAO: "${daoAddress}"`)
      .replace(/GAME:\s*"0x[a-fA-F0-9]+"/, `GAME: "${gameAddress}"`)
      .replace(/SWAP:\s*"0x[a-fA-F0-9]+"/, `SWAP: "${swapAddress}"`);
    
    // Se for localhost, atualiza a rede para Hardhat no frontend
    if (network.name === "localhost") {
      config = config.replace(/chainId: "0xaa36a7"/, `chainId: "0x7a69"`); // 31337 em hexa
      config = config.replace(/chainName: "Sepolia Testnet"/, `chainName: "Hardhat Local"`);
      config = config.replace(/rpcUrls: \["https:\/\/rpc.sepolia.org"\]/, `rpcUrls: ["http://127.0.0.1:8545"]`);
    }
      
    fs.writeFileSync(frontendConfigPath, config);
    console.log("✅ config.ts do front-end atualizado automaticamente!");
  }
}

main().catch((err) => {
  console.error("❌ Deploy falhou:", err);
  process.exitCode = 1;
});
