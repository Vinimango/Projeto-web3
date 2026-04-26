import { useEffect, useState } from "react";
import { formatUnits } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContracts } from "@/contexts/ContractContext";
import { toast } from "sonner";
import { Vote, Plus, Clock } from "lucide-react";

interface Proposal {
  id: number;
  description: string;
  votesFor: bigint;
  votesAgainst: bigint;
  deadline: bigint;
  executed: boolean;
  proposer: string;
}

const MOCK_PROPOSALS: Proposal[] = [
  { id: 0, description: "Reduzir taxa do protocolo para 1%", votesFor: BigInt("124000000000000000000"), votesAgainst: BigInt("32000000000000000000"), deadline: BigInt(Math.floor(Date.now() / 1000) + 86400), executed: false, proposer: "0x0000000000000000000000000000000000000000" },
  { id: 1, description: "Adicionar nova liga de futebol", votesFor: BigInt("87000000000000000000"), votesAgainst: BigInt("12000000000000000000"), deadline: BigInt(Math.floor(Date.now() / 1000) + 172800), executed: false, proposer: "0x0000000000000000000000000000000000000000" },
  { id: 2, description: "Aumentar recompensa de staking", votesFor: BigInt("201000000000000000000"), votesAgainst: BigInt("45000000000000000000"), deadline: BigInt(Math.floor(Date.now() / 1000) - 3600), executed: true, proposer: "0x0000000000000000000000000000000000000000" },
];

function formatVotes(v: bigint) {
  return parseFloat(formatUnits(v, 18)).toFixed(0);
}

function getStatus(p: Proposal) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (p.executed) return { label: "Executada", color: "text-blue-500" };
  if (now > p.deadline) return { label: "Encerrada", color: "text-muted-foreground" };
  return { label: "Ativa", color: "text-green-500" };
}

function timeLeft(deadline: bigint) {
  const secs = Number(deadline) - Math.floor(Date.now() / 1000);
  if (secs <= 0) return "Encerrado";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

export function DaoPanel() {
  const { account, daoContract } = useContracts();
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [newProposal, setNewProposal] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 📖 Leitura: busca propostas do contrato
  useEffect(() => {
    if (!daoContract) return;
    (async () => {
      try {
        const onchain = await daoContract.getProposals();
        if (Array.isArray(onchain) && onchain.length > 0) {
          setProposals(
            onchain.map((p: { id: bigint; description: string; votesFor: bigint; votesAgainst: bigint; deadline: bigint; executed: boolean; proposer: string }) => ({
              id: Number(p.id),
              description: p.description,
              votesFor: p.votesFor,
              votesAgainst: p.votesAgainst,
              deadline: p.deadline,
              executed: p.executed,
              proposer: p.proposer,
            }))
          );
        }
      } catch {
        // Usa mock enquanto contrato não está deployado
      }
    })();
  }, [daoContract]);

  // ✍️ Criar proposta
  const handleCreate = async () => {
    if (!daoContract || !newProposal.trim()) return;
    try {
      setCreating(true);
      toast.info("Criando proposta…");
      const tx = await daoContract.createProposal(newProposal.trim());
      await tx.wait();
      toast.success("Proposta criada! 🗳️");
      setNewProposal("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar proposta. Você precisa de ≥ 100 BANANA.");
    } finally {
      setCreating(false);
    }
  };

  // ✍️ Votar
  const handleVote = async (proposalId: number, support: boolean) => {
    if (!daoContract || !account) return;
    try {
      setVotingId(proposalId);
      toast.info("Enviando voto…");
      const tx = await daoContract.vote(proposalId, support);
      await tx.wait();
      toast.success("Voto registrado! 🗳️");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao votar");
    } finally {
      setVotingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            <CardTitle>Governança DAO</CardTitle>
          </div>
          {account && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-3 w-3 mr-1" /> Nova
            </Button>
          )}
        </div>
        <CardDescription>Participe das decisões do Bet do Macaquinho</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Formulário nova proposta */}
        {showForm && (
          <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Requer ≥ 100 BANANA no saldo</p>
            <Input
              placeholder="Descreva sua proposta…"
              value={newProposal}
              onChange={(e) => setNewProposal(e.target.value)}
              disabled={creating}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={creating || !newProposal.trim()} className="flex-1">
                {creating ? "Enviando…" : "Criar Proposta"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de propostas */}
        {proposals.map((p) => {
          const status = getStatus(p);
          const isActive = !p.executed && BigInt(Math.floor(Date.now() / 1000)) <= p.deadline;
          const total = Number(p.votesFor) + Number(p.votesAgainst);
          const pctFor = total > 0 ? (Number(p.votesFor) / total) * 100 : 0;

          return (
            <div key={p.id} className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground flex-1">{p.description}</p>
                <span className={`text-xs font-medium shrink-0 ${status.color}`}>{status.label}</span>
              </div>

              {/* Barra de progresso */}
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${pctFor}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>✅ {formatVotes(p.votesFor)} · ❌ {formatVotes(p.votesAgainst)}</span>
                {isActive && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {timeLeft(p.deadline)}
                  </span>
                )}
              </div>

              {isActive && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!account || votingId === p.id}
                    onClick={() => handleVote(p.id, true)}
                    className="flex-1"
                  >
                    A favor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!account || votingId === p.id}
                    onClick={() => handleVote(p.id, false)}
                    className="flex-1"
                  >
                    Contra
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
