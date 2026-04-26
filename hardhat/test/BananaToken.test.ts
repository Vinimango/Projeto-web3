import { ethers } from "hardhat";
import { expect } from "chai";

describe("BananaToken", () => {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const BananaToken = await ethers.getContractFactory("BananaToken");
    const token = await BananaToken.deploy();
    return { token, owner, alice, bob };
  }

  it("deve ter nome e símbolo corretos", async () => {
    const { token } = await deploy();
    expect(await token.name()).to.equal("Banana Token");
    expect(await token.symbol()).to.equal("BANANA");
  });

  it("deve mintar 1.000.000 BANANA para o deployer", async () => {
    const { token, owner } = await deploy();
    const supply = await token.totalSupply();
    expect(supply).to.equal(ethers.parseUnits("1000000", 18));
    expect(await token.balanceOf(owner.address)).to.equal(supply);
  });

  it("deve permitir ao owner adicionar minter", async () => {
    const { token, alice } = await deploy();
    await token.addMinter(alice.address);
    expect(await token.minters(alice.address)).to.be.true;
  });

  it("minter autorizado deve poder mintar tokens", async () => {
    const { token, alice, bob } = await deploy();
    await token.addMinter(alice.address);
    await token.connect(alice).mint(bob.address, ethers.parseUnits("500", 18));
    expect(await token.balanceOf(bob.address)).to.equal(ethers.parseUnits("500", 18));
  });

  it("não-minter não pode mintar", async () => {
    const { token, alice, bob } = await deploy();
    await expect(
      token.connect(alice).mint(bob.address, ethers.parseUnits("100", 18))
    ).to.be.revertedWith("BananaToken: not a minter");
  });

  it("deve permitir burn de tokens", async () => {
    const { token, owner } = await deploy();
    const amount = ethers.parseUnits("100", 18);
    await token.burn(amount);
    expect(await token.balanceOf(owner.address)).to.equal(
      ethers.parseUnits("999900", 18)
    );
  });

  it("deve remover minter corretamente", async () => {
    const { token, alice } = await deploy();
    await token.addMinter(alice.address);
    await token.removeMinter(alice.address);
    expect(await token.minters(alice.address)).to.be.false;
  });
});
