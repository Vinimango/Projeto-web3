# 🐒 MonkeyBet Protocol - Apostas Descentralizadas

O **MonkeyBet** é um ecossistema Web3 completo para apostas esportivas, staking e governança, construído na rede Ethereum (Sepolia). Ele combina a emoção das apostas com a transparência e segurança da tecnologia blockchain.

---

## 🛡️ Por que o MonkeyBet é mais seguro?

Sites de apostas convencionais (Web2) sofrem com falta de transparência, retenção indevida de saques e manipulação de resultados. O MonkeyBet resolve isso através de:

1.  **Não-Custodial:** Você não deposita dinheiro no site. Suas BANANAs ficam na sua carteira (MetaMask) e só saem para interagir com os contratos inteligentes que você autoriza.
2.  **Transparência On-Chain:** Todas as regras, odds e pagamentos são definidos por código imutável. Qualquer pessoa pode auditar o contrato para verificar se o sistema é justo.
3.  **Pagamentos Automáticos:** Não há processo de "solicitação de saque". Se você ganha uma aposta ou um jogo, os tokens são enviados/mintados diretamente para sua carteira via contrato.
4.  **Oráculos Confiáveis:** Utilizamos a **Chainlink** para obter preços reais do mercado, garantindo que as conversões de ETH/BANANA sejam justas e impossíveis de manipular internamente.

---

## 🛠️ Fatores Técnicos

*   **Smart Contracts:** Desenvolvidos em Solidity 0.8.28, utilizando bibliotecas **OpenZeppelin** para segurança e padrões ERC-20/ERC-721.
*   **Front-end:** SPA moderna construída com **React + Vite + TypeScript**.
*   **Integração Web3:** Conexão robusta via **ethers.js (v6)** com suporte a troca automática de rede.
*   **Estilização:** UI/UX premium utilizando **TailwindCSS** e componentes **Shadcn/UI**.
*   **Infraestrutura:** Deploy e automação via **Hardhat**.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
*   Node.js instalado
*   MetaMask no navegador (configurada para Sepolia)

### 1. Configuração do Backend (Smart Contracts)
```bash
cd hardhat
npm install
npx hardhat node  # Para rodar um nó local (opcional)
```

**Para fazer deploy na Sepolia:**
1. Crie um arquivo `.env` na pasta `hardhat` com:
   - `PRIVATE_KEY` (sua chave privada)
   - `ALCHEMY_API_KEY` (sua chave do Alchemy)
   - `ETHERSCAN_API_KEY` (1YVA2UQMQPGDZHBMJBXQMED479QJMWIZFI)
2. Execute o deploy:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### 2. Configuração do Front-end
```bash
cd monkey-bet-dao
npm install
npm run dev
```
O site estará disponível em `http://localhost:5173/`.

---

## 🐒 Módulos do Ecossistema

1.  **BananaToken (BANANA):** O combustível do protocolo.
2.  **Staking de Tokens:** Bloqueie BANANAs para receber rendimentos passivos.
3.  **Apostas Esportivas:** Minta NFTs que representam seus bilhetes de aposta on-chain.
4.  **Cara ou Coroa:** Jogo de sorte instantâneo com queima de tokens automática.
5.  **MonkeySwap:** Converta ETH em BANANA usando o preço real da Chainlink.
6.  **MonkeyDAO:** Participe do futuro do projeto votando em propostas.

---

