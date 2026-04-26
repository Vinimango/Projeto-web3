// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BananaToken
 * @dev Token ERC-20 nativo do protocolo MonkeyBet.
 *      Supply inicial: 1.000.000 BANANA para o deployer.
 *      Minters autorizados (ex: contrato de staking) podem emitir recompensas.
 */
contract BananaToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    mapping(address => bool) public minters;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "BananaToken: not a minter");
        _;
    }

    constructor() ERC20("Banana Token", "BANANA") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /// @notice Autoriza um endereço a mintar tokens (ex: contrato de staking)
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /// @notice Remove autorização de mint
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    /// @notice Mint de tokens — somente minters autorizados ou owner
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}
