import { useState, useEffect } from "react";
import { parseEther, formatEther } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContracts } from "@/contexts/ContractContext";
import { toast } from "sonner";
import { RefreshCcw, ArrowDown } from "lucide-react";

export function TokenSwap() {
  const { account, swapContract, provider } = useContracts();
  const [ethAmount, setEthAmount] = useState("");
  const [bananaEstimate, setBananaEstimate] = useState("0");
  const [loading, setLoading] = useState(false);
  const [priceInCents, setPriceInCents] = useState<number>(10);

  // Buscar o preço atual da BANANA do contrato
  useEffect(() => {
    if (!swapContract) return;
    const fetchPrice = async () => {
      try {
        const price = await swapContract.bananaPriceInCents();
        setPriceInCents(Number(price));
      } catch (e) {
        console.error("Erro ao buscar preço da BANANA:", e);
      }
    };
    fetchPrice();
  }, [swapContract]);

  // Estimar BANANAs baseado no valor de ETH (simulação off-chain para UX)
  // Nota: O cálculo real acontece no contrato usando o oracle
  useEffect(() => {
    if (!ethAmount || isNaN(Number(ethAmount))) {
      setBananaEstimate("0");
      return;
    }

    const estimate = async () => {
      try {
        // Simulamos o cálculo do contrato:
        // 1 ETH = PriceUSD / BananaPriceUSD
        // Aqui usamos um preço fixo de $3000 para a estimativa rápida no UI
        const mockEthPrice = 3000; 
        const bananaPriceUsd = priceInCents / 100;
        const estimate = (Number(ethAmount) * mockEthPrice) / bananaPriceUsd;
        setBananaEstimate(estimate.toLocaleString(undefined, { maximumFractionDigits: 2 }));
      } catch (e) {
        setBananaEstimate("0");
      }
    };
    estimate();
  }, [ethAmount, priceInCents]);

  const handleBuy = async () => {
    if (!swapContract || !ethAmount || !account) return;

    try {
      setLoading(true);
      const value = parseEther(ethAmount);

      toast.info("Processando compra de BANANAs...");
      const tx = await swapContract.buyTokens({ value });
      await tx.wait();

      toast.success("Compra realizada com sucesso! 🍌");
      setEthAmount("");
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("user rejected")) {
        toast.error("Transação rejeitada.");
      } else {
        toast.error("Erro ao comprar tokens.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-primary" />
          <CardTitle>Trocar ETH por BANANA</CardTitle>
        </div>
        <CardDescription>Converta seu Ethereum em tokens Banana instantaneamente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground ml-1">Você envia (ETH)</label>
          <Input
            type="number"
            placeholder="0.0"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            disabled={!account || loading}
          />
        </div>

        <div className="flex justify-center -my-2">
          <div className="bg-muted rounded-full p-2 border border-border">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground ml-1">Você recebe (est.)</label>
          <div className="flex items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
            <span className="flex-1 font-bold text-foreground">{bananaEstimate}</span>
            <span className="text-primary font-bold">BANANA</span>
          </div>
        </div>

        <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Preço BANANA:</span>
            <span className="font-medium text-foreground">${(priceInCents / 100).toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-muted-foreground">Taxa de rede:</span>
            <span className="font-medium text-foreground">Variable (Gas)</span>
          </div>
        </div>

        <Button
          onClick={handleBuy}
          disabled={!account || loading || !ethAmount || Number(ethAmount) <= 0}
          className="w-full h-11"
        >
          {loading ? "Processando..." : "Converter Agora"}
        </Button>

        {!account && (
          <p className="text-center text-xs text-muted-foreground">
            Conecte sua carteira para converter
          </p>
        )}
      </CardContent>
    </Card>
  );
}
