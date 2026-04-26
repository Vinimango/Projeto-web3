// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBananaToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
}

contract MonkeyGame is Ownable {
    IBananaToken public bananaToken;
    
    event CoinFlipped(address indexed player, uint8 choice, bool won, uint256 amount);

    constructor(address _bananaToken) Ownable(msg.sender) {
        bananaToken = IBananaToken(_bananaToken);
    }

    /**
     * @notice Jogo de Cara ou Coroa.
     * @param choice 0 para Cara, 1 para Coroa.
     * @param amount Quantidade de BANANA apostada.
     */
    function flipCoin(uint8 choice, uint256 amount) external {
        require(choice <= 1, "Escolha invalida");
        require(amount > 0, "Valor deve ser maior que zero");
        require(bananaToken.balanceOf(msg.sender) >= amount, "Saldo insuficiente");

        // Simulação de aleatoriedade simples para MVP
        // Em produção, usaria Chainlink VRF
        uint8 result = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 2);
        
        bool won = (choice == result);

        if (won) {
            // Ganhou: recebe o dobro (minta amount)
            // Como ele já tem o amount original, mintamos mais amount para totalizar 2x
            bananaToken.mint(msg.sender, amount);
        } else {
            // Perdeu: queima o valor apostado
            bananaToken.burnFrom(msg.sender, amount);
        }

        emit CoinFlipped(msg.sender, choice, won, amount);
    }
}
