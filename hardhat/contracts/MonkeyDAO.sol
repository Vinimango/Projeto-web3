// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./BananaToken.sol";

/**
 * @title MonkeyDAO
 * @dev Governança simplificada do protocolo MonkeyBet.
 *
 * Regras:
 * - Criar proposta: requer >= 100 BANANA no saldo
 * - Votar: peso = saldo BANANA no momento do voto (1 token = 1 voto)
 * - Período de votação: 3 dias
 * - Quórum mínimo: 10 BANANA em votos totais
 * - Executar: após prazo, se votesFor > votesAgainst
 *
 * Proteção: ReentrancyGuard, sem duplo voto.
 */
contract MonkeyDAO is ReentrancyGuard, Ownable {
    BananaToken public immutable bananaToken;

    uint256 public constant MIN_TOKENS_TO_PROPOSE = 100 * 10 ** 18;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_QUORUM = 10 * 10 ** 18;

    struct Proposal {
        uint256 id;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        address proposer;
    }

    Proposal[] private _proposals;

    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description, uint256 deadline);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);

    constructor(address _bananaToken) Ownable(msg.sender) {
        bananaToken = BananaToken(_bananaToken);
    }

    // ─── Criação ──────────────────────────────────────────────────────────────

    /**
     * @notice Cria uma nova proposta de governança
     * @param description Texto descritivo da proposta
     */
    function createProposal(string calldata description) external returns (uint256) {
        require(
            bananaToken.balanceOf(msg.sender) >= MIN_TOKENS_TO_PROPOSE,
            "DAO: need >= 100 BANANA to propose"
        );

        uint256 id = _proposals.length;
        uint256 deadline = block.timestamp + VOTING_PERIOD;

        _proposals.push(
            Proposal({
                id: id,
                description: description,
                votesFor: 0,
                votesAgainst: 0,
                deadline: deadline,
                executed: false,
                proposer: msg.sender
            })
        );

        emit ProposalCreated(id, msg.sender, description, deadline);
        return id;
    }

    // ─── Votação ──────────────────────────────────────────────────────────────

    /**
     * @notice Vota em uma proposta com peso igual ao saldo BANANA do votante
     * @param proposalId ID da proposta
     * @param support    true = a favor, false = contra
     */
    function vote(uint256 proposalId, bool support) external nonReentrant {
        require(proposalId < _proposals.length, "DAO: proposal does not exist");
        Proposal storage p = _proposals[proposalId];

        require(block.timestamp <= p.deadline, "DAO: voting period ended");
        require(!hasVoted[proposalId][msg.sender], "DAO: already voted");

        uint256 weight = bananaToken.balanceOf(msg.sender);
        require(weight > 0, "DAO: no voting power (need BANANA)");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    // ─── Execução ─────────────────────────────────────────────────────────────

    /**
     * @notice Executa uma proposta após o período de votação
     * @param proposalId ID da proposta
     */
    function executeProposal(uint256 proposalId) external {
        require(proposalId < _proposals.length, "DAO: proposal does not exist");
        Proposal storage p = _proposals[proposalId];

        require(block.timestamp > p.deadline, "DAO: voting period not ended");
        require(!p.executed, "DAO: already executed");

        uint256 totalVotes = p.votesFor + p.votesAgainst;
        require(totalVotes >= MIN_QUORUM, "DAO: quorum not reached");

        p.executed = true;
        bool passed = p.votesFor > p.votesAgainst;

        emit ProposalExecuted(proposalId, passed);
    }

    // ─── Views compatíveis com front-end ─────────────────────────────────────

    /// @notice Retorna todas as propostas (compatível com DaoPanel.tsx)
    function getProposals() external view returns (Proposal[] memory) {
        return _proposals;
    }

    function getProposalCount() external view returns (uint256) {
        return _proposals.length;
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId < _proposals.length, "DAO: proposal does not exist");
        return _proposals[proposalId];
    }
}
