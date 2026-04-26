// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

interface IBananaToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract MonkeySwap is Ownable {
    IBananaToken public bananaToken;
    AggregatorV3Interface public priceFeed;
    
    // Preço de 1 BANANA em centavos de USD (ex: 10 = $0.10)
    uint256 public bananaPriceInCents = 10;

    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 bananaAmount);

    constructor(address _bananaToken, address _priceFeed) Ownable(msg.sender) {
        bananaToken = IBananaToken(_bananaToken);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    /**
     * @notice Compra BANANAs enviando ETH.
     * O preço é calculado usando o oráculo da Chainlink.
     */
    function buyTokens() external payable {
        require(msg.value > 0, "Envie ETH para comprar");

        // Pega o preço do ETH em USD (8 decimais)
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Erro no oraculo de preco");

        // price = USD per ETH (com 8 decimais)
        // msg.value = ETH (com 18 decimais)
        
        // Valor total em USD (com 18 + 8 = 26 decimais)
        uint256 totalUsdValue = msg.value * uint256(price);

        // BANANA tem 18 decimais. 
        // Queremos: amount = totalUsdValue / bananaPriceInUsd
        // bananaPriceInUsd = bananaPriceInCents / 100 (com 8 decimais do oracle = cents * 10^6)
        
        uint256 bananaPriceUsd8Decimals = bananaPriceInCents * 10**6; 
        
        // Quantidade de BANANA = totalUsdValue / bananaPriceUsd8Decimals
        // (26 decimais / 8 decimais = 18 decimais, que é o padrão do ERC20)
        uint256 bananaAmount = totalUsdValue / bananaPriceUsd8Decimals;

        bananaToken.mint(msg.sender, bananaAmount);

        emit TokensPurchased(msg.sender, msg.value, bananaAmount);
    }

    /**
     * @notice Permite ao dono sacar o ETH acumulado no contrato.
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function setBananaPrice(uint256 _newPriceInCents) external onlyOwner {
        bananaPriceInCents = _newPriceInCents;
    }
}
