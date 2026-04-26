/**
 * 🔧 CONFIGURAÇÃO DOS SMART CONTRACTS — Bet do Macaquinho
 *
 * Após rodar `npm run deploy:sepolia` na pasta /hardhat,
 * os endereços abaixo são atualizados automaticamente pelo script de deploy.
 *
 * Para atualizar manualmente, cole os endereços do arquivo:
 *   hardhat/deployed-addresses.json
 */

// ============================================================
// 📍 ENDEREÇOS DOS CONTRATOS
// ============================================================
export const CONTRACT_ADDRESSES = {
  TOKEN: "0x12d3C89833414FB9Dde4F3B7B65A31d68fa9A8f6",   // ⬅️ BananaToken (ERC-20)
  NFT: "0xE2b53Ad2eac17de5Dc2EE862A7584303de6Ecad9",     // ⬅️ BetTicket (ERC-721)
  STAKING: "0x9Af6a0A14Fc13007E89dD0057B7C232b81420228", // ⬅️ MonkeyStaking
  DAO: "0x49f959570Cef4Fad62495E7DF54f61F46748869a",     // ⬅️ MonkeyDAO
  GAME: "0x7c82DC13A7e5eb94F3449344c88d2F8E8E08ca83",    // ⬅️ MonkeyGame (Cara ou Coroa)
  SWAP: "0xEe608d24cB56a0C8fDc9E4042Dd0b98b2dcEB67E",    // ⬅️ MonkeySwap (ETH -> BANANA)
} as const;

// ============================================================
// 🌐 REDE BLOCKCHAIN — Sepolia Testnet
// ============================================================
export const NETWORK_CONFIG = {
  chainId: "0xaa36a7", // Sepolia (11155111)
  chainName: "Sepolia Testnet",
  rpcUrls: ["https://eth-sepolia.g.alchemy.com/v2/230ntKtj_yHM8LnZw7ATT"],
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

// ============================================================
// 📜 ABIs — Contratos MonkeyBet
// ============================================================

// 🍌 BananaToken — ERC-20 com mint controlado por minters
export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function addMinter(address minter)",
  "function removeMinter(address minter)",
  "function minters(address) view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event MinterAdded(address indexed minter)",
  "event MinterRemoved(address indexed minter)",
];

// 🎟️ BetTicket — ERC-721 com bilhetes on-chain
export const NFT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function mintTicket(address to, uint256 eventId, uint256 amount, string eventName, string odd) returns (uint256)",
  "function settleTicket(uint256 tokenId, bool won)",
  "function authorize(address minter)",
  "function revoke(address minter)",
  "function authorizedMinters(address) view returns (bool)",
  "function tickets(uint256 tokenId) view returns (uint256 eventId, uint256 amount, address bettor, bool settled, bool won, string eventName, string odd)",
  "event TicketMinted(uint256 indexed tokenId, address indexed bettor, uint256 eventId, uint256 amount)",
  "event TicketSettled(uint256 indexed tokenId, bool won)",
];

// 💰 MonkeyStaking — Staking com APY dinâmico via Chainlink ETH/USD
export const STAKING_ABI = [
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claimRewards()",
  "function stakedBalance(address user) view returns (uint256)",
  "function rewards(address user) view returns (uint256)",
  "function calculateReward(address user) view returns (uint256)",
  "function getLatestPrice() view returns (int256)",
  "function getAdjustedAPY() view returns (uint256)",
  "function getEthPrice() view returns (int256)",
  "function totalStaked() view returns (uint256)",
  "function stakes(address user) view returns (uint256 amount, uint256 since, uint256 lastClaimedAt)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount, uint256 reward)",
  "event RewardsClaimed(address indexed user, uint256 reward)",
];

// 🗳️ MonkeyDAO — Governança com votação ponderada por BANANA
export const DAO_ABI = [
  "function createProposal(string description) returns (uint256)",
  "function vote(uint256 proposalId, bool support)",
  "function executeProposal(uint256 proposalId)",
  "function getProposals() view returns (tuple(uint256 id, string description, uint256 votesFor, uint256 votesAgainst, uint256 deadline, bool executed, address proposer)[])",
  "function getProposal(uint256 proposalId) view returns (tuple(uint256 id, string description, uint256 votesFor, uint256 votesAgainst, uint256 deadline, bool executed, address proposer))",
  "function getProposalCount() view returns (uint256)",
  "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
  "function MIN_TOKENS_TO_PROPOSE() view returns (uint256)",
  "function VOTING_PERIOD() view returns (uint256)",
  "event ProposalCreated(uint256 indexed id, address indexed proposer, string description, uint256 deadline)",
  "event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)",
  "event ProposalExecuted(uint256 indexed proposalId, bool passed)",
];

// 🪙 MonkeyGame — Cara ou Coroa
export const GAME_ABI = [
  "function flipCoin(uint8 choice, uint256 amount)",
  "event CoinFlipped(address indexed player, uint8 choice, bool won, uint256 amount)",
];

// 💱 MonkeySwap — ETH -> BANANA
export const SWAP_ABI = [
  "function buyTokens() external payable",
  "function bananaPriceInCents() external view returns (uint256)",
  "event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 bananaAmount)",
];
