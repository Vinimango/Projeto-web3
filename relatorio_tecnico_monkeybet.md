# Relatório Técnico: Projeto MonkeyBet

Este relatório descreve os fatores técnicos e a arquitetura do ecossistema MonkeyBet, baseado na documentação técnica fornecida e na implementação atual.

## 1. Arquitetura do Sistema

O projeto MonkeyBet é um protocolo de apostas e governança descentralizada (DeFi + GameFi) operando na rede **Ethereum (Sepolia Testnet)**. A arquitetura é composta por quatro pilares principais:

### 1.1 Camada de Contratos (Smart Contracts)
*   **BananaToken (BANANA):** Token utilitário ERC-20 central do ecossistema, com suporte a `mint` e `burn` controlado por módulos autorizados.
*   **BetTicket (NFT):** Bilhetes de aposta representados como tokens ERC-721. Cada NFT contém metadados on-chain sobre o evento, as odds e o valor apostado.
*   **MonkeyStaking:** Módulo de staking que permite aos usuários travar BANANAs em troca de rendimentos (APY) calculados dinamicamente.
*   **MonkeyDAO:** Sistema de governança onde portadores de BANANA podem criar e votar em propostas de melhoria do protocolo.
*   **MonkeyGame (Cara ou Coroa):** Módulo de apostas instantâneas com lógica de recompensa/queima on-chain.
*   **MonkeySwap:** Conversor de ETH para BANANA utilizando oráculos de preço.

### 1.2 Integração de Oráculos (Chainlink)
O protocolo utiliza o **Chainlink Price Feed (ETH/USD)** para garantir que as conversões de tokens e os cálculos de valor de mercado sejam precisos e resistentes a manipulações de flash loans.

---

## 2. Fatores Técnicos de Implementação

### 2.1 Front-end e UX
*   **Stack:** Vite.js com React e TypeScript.
*   **Styling:** Tailwind CSS para uma interface moderna e responsiva.
*   **Conectividade:** Uso da biblioteca `ethers.js` (v6) para comunicação direta com a blockchain e integração com a carteira MetaMask.
*   **Sincronização:** Implementação de `ContractContext` para gerenciamento de estado global da blockchain, garantindo que saldos e dados de contratos sejam atualizados em tempo real.

### 2.2 Segurança e Robustez
*   **OpenZeppelin:** Utilização das bibliotecas padrão da indústria para garantir a segurança dos tokens (ERC20, ERC721) e o controle de acesso (`Ownable`, `AccessControl`).
*   **Lógica de Queima (Burn):** Implementação de mecanismos deflacionários onde tokens apostados e perdidos são removidos de circulação, aumentando a escassez.
*   **Verificação:** Contratos verificados no Etherscan para transparência total do código-fonte.

---

## 3. Fluxo de Dados

1.  **Entrada:** Usuário converte ETH em BANANA via `MonkeySwap`.
2.  **Atividade:** O usuário escolhe entre Staking (rendimento passivo), Apostas Esportivas (NFTs) ou Cara ou Coroa (aposta instantânea).
3.  **Governança:** Acúmulo de BANANAs concede poder de voto na `MonkeyDAO`, permitindo influenciar parâmetros como taxas e recompensas.

---
**Conclusão:** O projeto MonkeyBet demonstra uma implementação técnica sólida, unindo os conceitos de utilidade de tokens, escassez via NFTs e descentralização via DAO, tudo ancorado por oráculos confiáveis.
