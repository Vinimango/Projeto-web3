import { ethers } from "hardhat";
import { expect } from "chai";

describe("BetTicket", () => {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const BetTicket = await ethers.getContractFactory("BetTicket");
    const ticket = await BetTicket.deploy();
    return { ticket, owner, alice, bob };
  }

  it("deve ter nome e símbolo corretos", async () => {
    const { ticket } = await deploy();
    expect(await ticket.name()).to.equal("MonkeyBet Ticket");
    expect(await ticket.symbol()).to.equal("MBET");
  });

  it("owner pode mintar um bilhete NFT", async () => {
    const { ticket, owner, alice } = await deploy();
    await ticket.mintTicket(alice.address, 1, ethers.parseUnits("10", 18), "Macacos FC vs Bananas", "2.5x");
    expect(await ticket.balanceOf(alice.address)).to.equal(1);
    expect(await ticket.totalSupply()).to.equal(1);
  });

  it("ticket gerado tem dados corretos", async () => {
    const { ticket, alice } = await deploy();
    await ticket.mintTicket(alice.address, 1, ethers.parseUnits("10", 18), "Evento Teste", "3.0x");
    const t = await ticket.tickets(0);
    expect(t.eventId).to.equal(1n);
    expect(t.settled).to.be.false;
    expect(t.won).to.be.false;
    expect(t.eventName).to.equal("Evento Teste");
    expect(t.odd).to.equal("3.0x");
  });

  it("endereço não autorizado não pode mintar", async () => {
    const { ticket, alice, bob } = await deploy();
    await expect(
      ticket.connect(alice).mintTicket(bob.address, 1, 100n, "Jogo", "2x")
    ).to.be.revertedWith("BetTicket: not authorized");
  });

  it("endereço autorizado pode mintar", async () => {
    const { ticket, alice, bob } = await deploy();
    await ticket.authorize(alice.address);
    await ticket.connect(alice).mintTicket(bob.address, 2, 200n, "Copa Macaco", "1.8x");
    expect(await ticket.balanceOf(bob.address)).to.equal(1);
  });

  it("owner pode resolver (settle) ticket como ganhou", async () => {
    const { ticket, alice } = await deploy();
    await ticket.mintTicket(alice.address, 1, 100n, "Final", "2x");
    await ticket.settleTicket(0, true);
    const t = await ticket.tickets(0);
    expect(t.settled).to.be.true;
    expect(t.won).to.be.true;
  });

  it("não pode resolver ticket já resolvido", async () => {
    const { ticket, alice } = await deploy();
    await ticket.mintTicket(alice.address, 1, 100n, "Jogo", "2x");
    await ticket.settleTicket(0, true);
    await expect(ticket.settleTicket(0, false)).to.be.revertedWith("BetTicket: already settled");
  });

  it("tokenURI retorna data URI em base64", async () => {
    const { ticket, alice } = await deploy();
    await ticket.mintTicket(alice.address, 1, 100n, "Teste", "2x");
    const uri = await ticket.tokenURI(0);
    expect(uri.startsWith("data:application/json;base64,")).to.be.true;
  });
});
