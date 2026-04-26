// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./BananaToken.sol";

/**
 * @title MonkeyStaking
 * @dev Contrato de staking com recompensas dinâmicas baseadas no preço ETH/USD (Chainlink).
 *
 * APY base: 10%
 * Se ETH > $3000 → APY 15%
 * Se ETH > $2000 → APY 12%
 * Caso contrário  → APY 10%
 *
 * Proteção: ReentrancyGuard, controle de acesso.
 */
contract MonkeyStaking is ReentrancyGuard, Ownable {
    BananaToken public immutable bananaToken;
    AggregatorV3Interface public immutable priceFeed;

    uint256 public constant BASE_APY = 10;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    struct StakeInfo {
        uint256 amount;
        uint256 since;
        uint256 lastClaimedAt;
    }

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardsClaimed(address indexed user, uint256 reward);

    constructor(address _bananaToken, address _priceFeed) Ownable(msg.sender) {
        bananaToken = BananaToken(_bananaToken);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // ─── Oráculo ──────────────────────────────────────────────────────────────

    /// @notice Retorna o preço ETH/USD com 8 casas decimais (Chainlink)
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    /// @notice APY ajustado pelo preço do ETH
    function getAdjustedAPY() public view returns (uint256) {
        int256 price = getLatestPrice();
        if (price > 3_000 * 1e8) return 15;
        if (price > 2_000 * 1e8) return 12;
        return BASE_APY;
    }

    // ─── Cálculo de recompensa ────────────────────────────────────────────────

    /// @notice Calcula recompensas pendentes para um usuário
    function calculateReward(address user) public view returns (uint256) {
        StakeInfo memory info = stakes[user];
        if (info.amount == 0) return 0;

        uint256 elapsed = block.timestamp - info.lastClaimedAt;
        uint256 apy = getAdjustedAPY();

        // reward = amount * apy% * elapsed / 1 year
        return (info.amount * apy * elapsed) / (100 * SECONDS_PER_YEAR);
    }

    // ─── Ações ────────────────────────────────────────────────────────────────

    /**
     * @notice Faz stake de tokens BANANA.
     *         Recompensas pendentes são creditadas automaticamente antes do stake.
     * @param amount Quantidade em wei
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Staking: amount must be > 0");

        // Auto-claim de recompensas pendentes
        uint256 pending = calculateReward(msg.sender);
        if (pending > 0) {
            stakes[msg.sender].lastClaimedAt = block.timestamp;
            bananaToken.mint(msg.sender, pending);
            emit RewardsClaimed(msg.sender, pending);
        }

        bananaToken.transferFrom(msg.sender, address(this), amount);

        if (stakes[msg.sender].since == 0) {
            stakes[msg.sender].since = block.timestamp;
        }
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].lastClaimedAt = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Remove tokens do stake, creditando recompensas junto.
     * @param amount Quantidade a remover
     */
    function unstake(uint256 amount) external nonReentrant {
        require(stakes[msg.sender].amount >= amount, "Staking: insufficient staked balance");

        uint256 reward = calculateReward(msg.sender);

        stakes[msg.sender].amount -= amount;
        stakes[msg.sender].lastClaimedAt = block.timestamp;
        totalStaked -= amount;

        bananaToken.transfer(msg.sender, amount);

        if (reward > 0) {
            bananaToken.mint(msg.sender, reward);
        }

        emit Unstaked(msg.sender, amount, reward);
    }

    /// @notice Saca somente as recompensas pendentes
    function claimRewards() external nonReentrant {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "Staking: no rewards to claim");

        stakes[msg.sender].lastClaimedAt = block.timestamp;
        bananaToken.mint(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    // ─── Views compatíveis com front-end ─────────────────────────────────────

    function stakedBalance(address user) external view returns (uint256) {
        return stakes[user].amount;
    }

    function rewards(address user) external view returns (uint256) {
        return calculateReward(user);
    }

    /// @notice Alias para front-end (retorna preço ETH/USD)
    function getEthPrice() external view returns (int256) {
        return getLatestPrice();
    }
}
