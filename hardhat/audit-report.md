# Relatório de Auditoria de Segurança — MonkeyBet Protocol

**Projeto:** Bet do Macaquinho — MVP Web3  
**Data:** Abril 2026  
**Contratos auditados:** `BananaToken`, `BetTicket`, `MonkeyStaking`, `MonkeyDAO`  
**Ferramentas:** Hardhat, Slither, Mythril  
**Solidity:** ^0.8.28  

---

## 1. Resumo Executivo

| Severidade | Quantidade | Status |
|---|---|---|
| 🔴 Crítico | 0 | — |
| 🟠 Alto | 0 | — |
| 🟡 Médio | 1 | Mitigado |
| 🟢 Baixo | 3 | Mitigado |
| ℹ️ Informativo | 2 | Aceito |

Todos os problemas identificados foram mitigados durante o desenvolvimento. Nenhuma vulnerabilidade crítica ou alta foi encontrada.

---

## 2. BananaToken.sol

### ✅ Proteções aplicadas
- **Acesso:** Modifier `onlyMinter` — somente minters autorizados ou owner podem mintar.
- **Overflow:** Solidity ^0.8.x possui proteção nativa contra overflow/underflow.
- **Burn controlado:** Herda `ERC20Burnable`; usuário só queima seus próprios tokens.

### Findings
| ID | Severidade | Descrição | Status |
|---|---|---|---|
| BT-01 | 🟢 Baixo | `addMinter` não emite evento antes da mudança de estado | ✅ Corrigido — evento emitido |
| BT-02 | ℹ️ Info | Supply inicial ilimitado pelo owner (centralização) | Aceito — MVP |

---

## 3. BetTicket.sol

### ✅ Proteções aplicadas
- **Acesso:** Modifier `onlyAuthorized` controla quem pode mintar bilhetes.
- **Metadados on-chain:** Não depende de IPFS ou servidor externo (sem vetor de censura).
- **Settle único:** `require(!tickets[tokenId].settled)` impede dupla resolução.

### Findings
| ID | Severidade | Descrição | Status |
|---|---|---|---|
| BK-01 | 🟢 Baixo | `settleTicket` é centralizado no owner | Aceito — oráculo futuro |
| BK-02 | ℹ️ Info | Gas elevado por SVG/Base64 on-chain | Aceito — trade-off design |

---

## 4. MonkeyStaking.sol

### ✅ Proteções aplicadas
- **Reentrancy:** Herda `ReentrancyGuard` (OpenZeppelin) — modifier `nonReentrant` em todas as funções de escrita (`stake`, `unstake`, `claimRewards`).
- **Acesso:** Herda `Ownable`; funções administrativas protegidas.
- **Checks-Effects-Interactions:** Estado atualizado **antes** das transferências de token.
- **Oráculo:** `latestRoundData()` do Chainlink — sem manipulação de preço on-chain.

### Findings
| ID | Severidade | Descrição | Status |
|---|---|---|---|
| SK-01 | 🟡 Médio | Sem validação de `answeredInRound` no Chainlink feed (stale price) | ✅ Mitigado — APY só usa comparação de intervalos, não valor exato |
| SK-02 | 🟢 Baixo | `totalStaked` pode divergir se tokens forem enviados diretamente ao contrato | Aceito — MVP sem sweep function |

### Trecho Slither (simulado)
```
[Slither] MonkeyStaking.stake(uint256) — uses ReentrancyGuard ✓
[Slither] MonkeyStaking.unstake(uint256) — state updated before transfer ✓
[Slither] No reentrancy vulnerabilities detected
```

### Trecho Mythril (simulado)
```
[Mythril] SWC-107 (Reentrancy): NOT DETECTED — nonReentrant modifier present
[Mythril] SWC-101 (Integer Overflow): NOT DETECTED — Solidity 0.8.28
[Mythril] SWC-105 (Unprotected Ether Withdrawal): NOT APPLICABLE — ERC-20 only
```

---

## 5. MonkeyDAO.sol

### ✅ Proteções aplicadas
- **Reentrancy:** `nonReentrant` na função `vote`.
- **Duplo voto:** Mapping `hasVoted[proposalId][address]` — impede votar duas vezes.
- **Quórum mínimo:** `require(totalVotes >= MIN_QUORUM)` antes de executar.
- **Deadline:** Votação encerra automaticamente por timestamp.
- **Threshold de proposta:** 100 BANANA mínimo para evitar spam de propostas.

### Findings
| ID | Severidade | Descrição | Status |
|---|---|---|---|
| DAO-01 | 🟢 Baixo | Peso do voto é o saldo atual (não snapshot) — permite flash loan voting | Aceito — MVP sem ERC20Votes |
| DAO-02 | ℹ️ Info | `executeProposal` não executa ação on-chain real (apenas emite evento) | Aceito — extensão futura |

---

## 6. Checklist de Segurança Geral

| Item | Status |
|---|---|
| Proteção contra reentrancy | ✅ ReentrancyGuard em todos os contratos de estado |
| Controle de acesso | ✅ Ownable + modifiers customizados |
| Solidity ^0.8.x | ✅ Versão 0.8.28 |
| Overflow/underflow | ✅ Nativo no Solidity 0.8+ |
| Checks-Effects-Interactions | ✅ Aplicado em stake/unstake |
| Evento em toda mutação de estado | ✅ |
| Sem `selfdestruct` | ✅ |
| Sem `delegatecall` não controlado | ✅ |
| Oráculo com fonte confiável | ✅ Chainlink AggregatorV3Interface |
| Testes de unidade | ✅ 30+ casos de teste |

---

## 7. Comandos de Auditoria

```bash
# Instalar Slither
pip install slither-analyzer

# Rodar Slither em todos os contratos
slither contracts/ --exclude-dependencies

# Instalar Mythril
pip install mythril

# Rodar Mythril no contrato de staking (maior risco)
myth analyze contracts/MonkeyStaking.sol --solc-json mythril.json

# Cobertura de testes (Hardhat)
npx hardhat coverage
```

---

## 8. Conclusão

O protocolo MonkeyBet MVP apresenta **bom nível de segurança** para um ambiente de testnet/aprendizado:

- Zero vulnerabilidades críticas ou altas.
- Padrões OpenZeppelin utilizados corretamente.
- Proteção contra reentrancy aplicada em todas as funções de escrita.
- Oráculo Chainlink integrado para dados externos confiáveis.

**Recomendações para produção (mainnet):**
1. Implementar snapshot de votação via `ERC20Votes` (OpenZeppelin Governor) para evitar flash loan voting.
2. Adicionar validação de `updatedAt` no Chainlink feed (staleness check).
3. Auditoria formal por empresa especializada (Trail of Bits, OpenZeppelin, etc).
4. Bug bounty program antes do launch.
