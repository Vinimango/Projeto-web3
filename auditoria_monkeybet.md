# Relatório de Auditoria Técnica: MonkeyBet Protocol

Este documento apresenta uma revisão técnica e de segurança dos contratos inteligentes do protocolo MonkeyBet.

## 1. Escopo da Auditoria
Os seguintes contratos foram revisados:
*   `BananaToken.sol` (ERC-20)
*   `BetTicket.sol` (ERC-721)
*   `MonkeyStaking.sol`
*   `MonkeyDAO.sol`
*   `MonkeyGame.sol`
*   `MonkeySwap.sol`

---

## 2. Resumo de Achados

| Gravidade | Quantidade | Status |
| :--- | :---: | :--- |
| 🔴 Alta | 0 | - |
| 🟡 Média | 1 | Mitigação recomendada |
| 🟢 Baixa | 2 | Informativo |

---

## 3. Detalhamento dos Achados

### 3.1 [🟡 Média] Aleatoriedade Previsível em `MonkeyGame.sol`
**Local:** Função `flipCoin`
**Descrição:** O contrato utiliza `block.timestamp` e `block.prevrandao` para determinar o resultado do Cara ou Coroa. Embora o `prevrandao` seja mais seguro que o antigo `difficulty`, ele ainda pode ser parcialmente influenciado por mineradores em cenários específicos.
**Impacto:** Um minerador mal-intencionado poderia, teoricamente, tentar manipular o resultado da aposta.
**Recomendação:** Para uma versão de produção com altos valores, recomenda-se a integração com o **Chainlink VRF (Verifiable Random Function)**.

### 3.2 [🟢 Baixa] Centralização de Permissões (Owner)
**Local:** Todos os contratos
**Descrição:** O endereço `deployer` detém poderes significativos (adicionar minters, sacar fundos do Swap, alterar preços).
**Impacto:** Se a chave privada do owner for comprometida, o protocolo corre risco.
**Recomendação:** Transferir a posse dos contratos para a `MonkeyDAO` ou usar uma carteira **Multi-Sig (Gnosis Safe)**.

### 3.3 [🟢 Baixa] Falta de Limites (Slippage) no `MonkeySwap.sol`
**Local:** Função `buyTokens`
**Descrição:** A compra de tokens é feita ao preço de mercado do oráculo sem um parâmetro de `minAmountOut`.
**Impacto:** Embora o preço venha de um oráculo confiável, mudanças bruscas de preço entre o envio da transação e a mineração podem resultar em menos tokens do que o esperado.
**Recomendação:** Adicionar um parâmetro de valor mínimo aceitável pelo usuário.

---

## 4. Análise de Segurança por Contrato

### BananaToken
*   ✅ Utiliza OpenZeppelin `ERC20Burnable`.
*   ✅ Controle de acesso por `minters` bem implementado.

### MonkeyStaking
*   ✅ Proteção contra reentrância via lógica de estado.
*   ✅ Cálculo de recompensas baseado em tempo (`block.timestamp`) é padrão para DeFi.

### MonkeyDAO
*   ✅ Lógica de votação robusta com verificação de peso (balance).
*   ✅ Implementação de `ProposalStatus` para evitar execuções duplicadas.

---

## 5. Conclusão Técnica
O código segue as melhores práticas de desenvolvimento em Solidity 0.8.x. A arquitetura é modular e utiliza bibliotecas testadas (OpenZeppelin). As vulnerabilidades encontradas são típicas de MVPs e podem ser resolvidas com a evolução do projeto para uma Mainnet.

**Veredito:** **APROVADO PARA TESTNET**
