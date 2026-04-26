import { ethers } from "hardhat";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("MonkeyStaking", () => {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();

    // Deploy BananaToken
    const BananaToken = await ethers.getContractFactory("BananaToken");
    const token = await BananaToken.deploy();

    // Deploy MockV3Aggregator com ETH = $2500 (8 decimais)
    const MockAgg = await ethers.getContractFactory("MockV3Aggregator");
    const mockFeed = await MockAgg.deploy(8, 2500n * 10n ** 8n);

    // Deploy Staking
    const Staking = await ethers.getContractFactory("MonkeyStaking");
    const staking = await Staking.deploy(await token.getAddress(), await mockFeed.getAddress());

    // Adiciona contrato de staking como minter
    await token.addMinter(await staking.getAddress());

    // Transfere tokens para alice
    await token.transfer(alice.address, ethers.parseUnits("10000", 18));

    return { token, staking, mockFeed, owner, alice, bob };
  }

  it("deve retornar preço ETH do oráculo", async () => {
    const { staking } = await deploy();
    const price = await staking.getLatestPrice();
    expect(price).to.equal(2500n * 10n ** 8n);
  });

  it("APY deve ser 12% quando ETH = $2500", async () => {
    const { staking } = await deploy();
    expect(await staking.getAdjustedAPY()).to.equal(12);
  });

  it("APY deve ser 15% quando ETH > $3000", async () => {
    const { staking, mockFeed } = await deploy();
    await mockFeed.updateAnswer(3500n * 10n ** 8n);
    expect(await staking.getAdjustedAPY()).to.equal(15);
  });

  it("APY deve ser 10% quando ETH < $2000", async () => {
    const { staking, mockFeed } = await deploy();
    await mockFeed.updateAnswer(1500n * 10n ** 8n);
    expect(await staking.getAdjustedAPY()).to.equal(10);
  });

  it("deve realizar stake corretamente", async () => {
    const { token, staking, alice } = await deploy();
    const amount = ethers.parseUnits("1000", 18);
    await token.connect(alice).approve(await staking.getAddress(), amount);
    await staking.connect(alice).stake(amount);
    expect(await staking.stakedBalance(alice.address)).to.equal(amount);
    expect(await staking.totalStaked()).to.equal(amount);
  });

  it("não deve staking de valor zero", async () => {
    const { staking, alice } = await deploy();
    await expect(staking.connect(alice).stake(0n)).to.be.revertedWith("Staking: amount must be > 0");
  });

  it("deve acumular recompensas ao longo do tempo", async () => {
    const { token, staking, alice } = await deploy();
    const amount = ethers.parseUnits("1000", 18);
    await token.connect(alice).approve(await staking.getAddress(), amount);
    await staking.connect(alice).stake(amount);

    // Avança 30 dias
    await time.increase(30 * 24 * 60 * 60);

    const reward = await staking.rewards(alice.address);
    expect(reward).to.be.gt(0n);
  });

  it("deve realizar unstake e receber tokens + recompensas", async () => {
    const { token, staking, alice } = await deploy();
    const amount = ethers.parseUnits("1000", 18);
    await token.connect(alice).approve(await staking.getAddress(), amount);
    await staking.connect(alice).stake(amount);

    await time.increase(30 * 24 * 60 * 60);

    const balanceBefore = await token.balanceOf(alice.address);
    await staking.connect(alice).unstake(amount);
    const balanceAfter = await token.balanceOf(alice.address);

    // Deve ter recebido mais do que depositou (tokens + recompensas)
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("claimRewards deve mintar recompensas sem remover stake", async () => {
    const { token, staking, alice } = await deploy();
    const amount = ethers.parseUnits("1000", 18);
    await token.connect(alice).approve(await staking.getAddress(), amount);
    await staking.connect(alice).stake(amount);

    await time.increase(60 * 24 * 60 * 60); // 60 dias

    await staking.connect(alice).claimRewards();
    // Stake ainda intacto
    expect(await staking.stakedBalance(alice.address)).to.equal(amount);
  });

  it("não deve unstake mais do que o staked", async () => {
    const { token, staking, alice } = await deploy();
    const amount = ethers.parseUnits("500", 18);
    await token.connect(alice).approve(await staking.getAddress(), amount);
    await staking.connect(alice).stake(amount);
    await expect(
      staking.connect(alice).unstake(ethers.parseUnits("1000", 18))
    ).to.be.revertedWith("Staking: insufficient staked balance");
  });
});
