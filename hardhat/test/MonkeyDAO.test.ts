import { ethers } from "hardhat";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("MonkeyDAO", () => {
  async function deploy() {
    const [owner, alice, bob, carol] = await ethers.getSigners();

    const BananaToken = await ethers.getContractFactory("BananaToken");
    const token = await BananaToken.deploy();

    const MonkeyDAO = await ethers.getContractFactory("MonkeyDAO");
    const dao = await MonkeyDAO.deploy(await token.getAddress());

    // Distribui tokens para testar
    await token.transfer(alice.address, ethers.parseUnits("500", 18));
    await token.transfer(bob.address, ethers.parseUnits("200", 18));
    // carol fica com apenas 50 BANANA (abaixo do mínimo para propor)
    await token.transfer(carol.address, ethers.parseUnits("50", 18));

    return { token, dao, owner, alice, bob, carol };
  }

  it("deve criar uma proposta com saldo suficiente", async () => {
    const { dao, alice } = await deploy();
    await dao.connect(alice).createProposal("Reduzir taxa do protocolo para 1%");
    expect(await dao.getProposalCount()).to.equal(1);
  });

  it("não deve criar proposta com saldo insuficiente", async () => {
    const { dao, carol } = await deploy();
    await expect(
      dao.connect(carol).createProposal("Proposta inválida")
    ).to.be.revertedWith("DAO: need >= 100 BANANA to propose");
  });

  it("deve registrar voto a favor", async () => {
    const { dao, alice, bob } = await deploy();
    await dao.connect(alice).createProposal("Adicionar nova liga");
    await dao.connect(bob).vote(0, true);
    const proposals = await dao.getProposals();
    expect(proposals[0].votesFor).to.equal(ethers.parseUnits("200", 18));
  });

  it("deve registrar voto contra", async () => {
    const { dao, alice, bob } = await deploy();
    await dao.connect(alice).createProposal("Proposta polêmica");
    await dao.connect(bob).vote(0, false);
    const proposals = await dao.getProposals();
    expect(proposals[0].votesAgainst).to.equal(ethers.parseUnits("200", 18));
  });

  it("não deve votar duas vezes", async () => {
    const { dao, alice, bob } = await deploy();
    await dao.connect(alice).createProposal("Proposta X");
    await dao.connect(bob).vote(0, true);
    await expect(dao.connect(bob).vote(0, true)).to.be.revertedWith("DAO: already voted");
  });

  it("não deve votar sem BANANA", async () => {
    const { dao, alice } = await deploy();
    const [, , , , nobody] = await ethers.getSigners();
    await dao.connect(alice).createProposal("Proposta Y");
    await expect(dao.connect(nobody).vote(0, true)).to.be.revertedWith("DAO: no voting power (need BANANA)");
  });

  it("não deve votar após o prazo", async () => {
    const { dao, alice, bob } = await deploy();
    await dao.connect(alice).createProposal("Proposta Expirada");
    await time.increase(4 * 24 * 60 * 60); // 4 dias
    await expect(dao.connect(bob).vote(0, true)).to.be.revertedWith("DAO: voting period ended");
  });

  it("deve executar proposta aprovada após prazo", async () => {
    const { dao, alice, bob } = await deploy();
    await dao.connect(alice).createProposal("Aumentar recompensas");
    await dao.connect(alice).vote(0, true);
    await dao.connect(bob).vote(0, true);

    await time.increase(4 * 24 * 60 * 60);
    await dao.executeProposal(0);

    const proposals = await dao.getProposals();
    expect(proposals[0].executed).to.be.true;
  });

  it("não deve executar antes do prazo", async () => {
    const { dao, alice } = await deploy();
    await dao.connect(alice).createProposal("Cedo demais");
    await expect(dao.executeProposal(0)).to.be.revertedWith("DAO: voting period not ended");
  });

  it("não deve executar sem quórum", async () => {
    const { dao, alice } = await deploy();
    await dao.connect(alice).createProposal("Sem votos suficientes");
    await time.increase(4 * 24 * 60 * 60);
    await expect(dao.executeProposal(0)).to.be.revertedWith("DAO: quorum not reached");
  });

  it("getProposals deve retornar todas as propostas", async () => {
    const { dao, alice } = await deploy();
    await dao.connect(alice).createProposal("Proposta 1");
    await dao.connect(alice).createProposal("Proposta 2");
    const list = await dao.getProposals();
    expect(list.length).to.equal(2);
    expect(list[0].description).to.equal("Proposta 1");
    expect(list[1].description).to.equal("Proposta 2");
  });
});
