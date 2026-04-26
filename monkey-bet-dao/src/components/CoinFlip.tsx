import { useState } from "react";
import { parseUnits } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContracts } from "@/contexts/ContractContext";
import { CONTRACT_ADDRESSES } from "@/contracts/config";
import { toast } from "sonner";
import { Coins, HelpCircle } from "lucide-react";

export function CoinFlip() {
  const { account, gameContract, tokenContract } = useContracts();
  const [choice, setChoice] = useState<0 | 1 | null>(null); // 0 = Cara, 1 = Coroa
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const handleFlip = async () => {
    if (!gameContract || !tokenContract || choice === null || !amount || !account) return;

    try {
      setLoading(true);
      const value = parseUnits(amount, 18);

      // 1. Aprovar BANANA para o contrato do jogo
      toast.info("Aprovando BANANAs...");
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.GAME, value);
      await approveTx.wait();

      // 2. Jogar
      toast.info("Lançando a moeda...");
      setFlipping(true);
      
      const flipTx = await gameContract.flipCoin(choice, value);
      const receipt = await flipTx.wait();

      // Procurar o evento CoinFlipped no recibo
      const event = receipt.logs
        .map((log: any) => {
          try {
            return gameContract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((e: any) => e && e.name === "CoinFlipped");

      setFlipping(false);

      if (event) {
        const won = event.args.won;
        if (won) {
          toast.success("VOCÊ GANHOU! 🍌🍌 Recebeu o dobro!");
        } else {
          toast.error("Você perdeu... A sorte não estava do seu lado. 🐒");
        }
      } else {
        toast.success("Transação concluída! Verifique seu saldo.");
      }
      
      setAmount("");
    } catch (err: any) {
      console.error(err);
      setFlipping(false);
      if (err.message?.includes("user rejected")) {
        toast.error("Transação rejeitada pelo usuário.");
      } else {
        toast.error("Erro ao jogar Cara ou Coroa.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {flipping && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-bounce rounded-full bg-primary flex items-center justify-center text-3xl">
               🪙
            </div>
            <p className="text-lg font-bold animate-pulse text-primary">Girando moeda...</p>
          </div>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <CardTitle>Cara ou Coroa</CardTitle>
        </div>
        <CardDescription>Aposte suas BANANAs e tente dobrar seu saldo!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button
            variant={choice === 0 ? "default" : "outline"}
            className="flex-1 py-8 text-lg flex flex-col gap-1"
            onClick={() => setChoice(0)}
            disabled={loading}
          >
            <span>Cara</span>
            <span className="text-xs opacity-70">(Heads)</span>
          </Button>
          <Button
            variant={choice === 1 ? "default" : "outline"}
            className="flex-1 py-8 text-lg flex flex-col gap-1"
            onClick={() => setChoice(1)}
            disabled={loading}
          >
            <span>Coroa</span>
            <span className="text-xs opacity-70">(Tails)</span>
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Valor da Aposta</span>
            <span>Ganho potencial: {amount ? (Number(amount) * 2).toFixed(2) : "0"} BANANA</span>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!account || loading}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Coins className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <Button
          onClick={handleFlip}
          disabled={!account || loading || choice === null || !amount}
          className="w-full h-12 text-lg font-bold"
        >
          {loading ? "Processando..." : "Jogar agora!"}
        </Button>

        {!account && (
          <p className="text-center text-xs text-muted-foreground">
            Conecte sua carteira para jogar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
