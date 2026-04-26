import { useEffect, useState } from "react";
import { parseUnits, formatUnits } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContracts } from "@/contexts/ContractContext";
import { CONTRACT_ADDRESSES } from "@/contracts/config";
import { toast } from "sonner";
import { Coins, TrendingUp, Zap } from "lucide-react";

export function StakingPanel() {
  const { account, tokenContract, stakingContract } = useContracts();
  const [amount, setAmount] = useState("");
  const [staked, setStaked] = useState("0");
  const [pendingRewards, setPendingRewards] = useState("0");
  const [ethPrice, setEthPrice] = useState<string | null>(null);
  const [currentAPY, setCurrentAPY] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"stake" | "unstake">("stake");

  // 📖 Leitura: saldo em stake, recompensas e dados do oráculo
  useEffect(() => {
    if (!stakingContract) return;
    const load = async () => {
      try {
        // Preço ETH/USD do Chainlink
        const price = await stakingContract.getEthPrice();
        setEthPrice((Number(price) / 1e8).toFixed(2));

        // APY atual
        const apy = await stakingContract.getAdjustedAPY();
        setCurrentAPY(apy.toString());
      } catch (err) {
        console.error("getEthPrice/APY:", err);
      }
    };
    load();
  }, [stakingContract]);

  useEffect(() => {
    if (!account || !stakingContract) return;
    const load = async () => {
      try {
        const bal = await stakingContract.stakedBalance(account);
        setStaked(formatUnits(bal, 18));
        const rew = await stakingContract.rewards(account);
        setPendingRewards(formatUnits(rew, 18));
      } catch (err) {
        console.error("stakedBalance/rewards:", err);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [account, stakingContract]);

  // ✍️ Stake
  const handleStake = async () => {
    if (!tokenContract || !stakingContract || !amount) return;
    try {
      setLoading(true);
      const value = parseUnits(amount, 18);
      toast.info("Aprovando tokens…");
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.STAKING, value);
      await approveTx.wait();
      toast.info("Realizando stake…");
      const stakeTx = await stakingContract.stake(value);
      await stakeTx.wait();
      toast.success("Stake realizado! 🐒");
      setAmount("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao executar stake");
    } finally {
      setLoading(false);
    }
  };

  // ✍️ Unstake
  const handleUnstake = async () => {
    if (!stakingContract || !amount) return;
    try {
      setLoading(true);
      const value = parseUnits(amount, 18);
      toast.info("Removendo stake…");
      const tx = await stakingContract.unstake(value);
      await tx.wait();
      toast.success("Unstake realizado! Tokens + recompensas recebidos 🎉");
      setAmount("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover stake");
    } finally {
      setLoading(false);
    }
  };

  // ✍️ Claim Rewards
  const handleClaim = async () => {
    if (!stakingContract) return;
    try {
      setLoading(true);
      toast.info("Sacando recompensas…");
      const tx = await stakingContract.claimRewards();
      await tx.wait();
      toast.success("Recompensas sacadas! 🍌");
    } catch (err) {
      console.error(err);
      toast.error("Sem recompensas para sacar ou erro na transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <CardTitle>Staking de Tokens</CardTitle>
        </div>
        <CardDescription>
          Em stake: <span className="font-mono text-foreground">{parseFloat(staked).toFixed(4)} BANANA</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats do oráculo */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" /> ETH/USD
            </div>
            <p className="font-mono text-sm text-foreground">
              {ethPrice ? `$${ethPrice}` : "—"}
            </p>
          </div>
          <div className="rounded-md border border-border p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Zap className="h-3 w-3" /> APY Atual
            </div>
            <p className="font-mono text-sm text-primary font-bold">
              {currentAPY ? `${currentAPY}%` : "—"}
            </p>
          </div>
        </div>

        {/* Recompensas pendentes */}
        {account && parseFloat(pendingRewards) > 0 && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Recompensas: <span className="font-mono text-primary">{parseFloat(pendingRewards).toFixed(6)} BANANA</span>
            </span>
            <Button size="sm" variant="outline" onClick={handleClaim} disabled={loading}>
              Sacar
            </Button>
          </div>
        )}

        {/* Toggle Stake/Unstake */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={action === "stake" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setAction("stake")}
          >
            Stake
          </Button>
          <Button
            size="sm"
            variant={action === "unstake" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setAction("unstake")}
          >
            Unstake
          </Button>
        </div>

        <Input
          type="number"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!account || loading}
        />
        <Button
          onClick={action === "stake" ? handleStake : handleUnstake}
          disabled={!account || loading || !amount}
          className="w-full"
        >
          {loading ? "Processando…" : action === "stake" ? "Fazer Stake" : "Remover Stake"}
        </Button>
      </CardContent>
    </Card>
  );
}
