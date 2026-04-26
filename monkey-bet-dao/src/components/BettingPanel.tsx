import { useState } from "react";
import { parseUnits } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContracts } from "@/contexts/ContractContext";
import { toast } from "sonner";
import { Ticket } from "lucide-react";

// 🎮 Lista de eventos esportivos — substitua por leitura on-chain ou backend
const MOCK_EVENTS = [
  { id: 1, title: "Macacos FC vs. Bananas United", odd: "2.5x" },
  { id: 2, title: "Selva Sports vs. Tropical Stars", odd: "1.8x" },
  { id: 3, title: "Jungle Kings vs. River Monkeys", odd: "3.2x" },
];

export function BettingPanel() {
  const { account, nftContract } = useContracts();
  const [selected, setSelected] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // ✍️ ESCRITA: minta o NFT bilhete de aposta
  // Passes eventName and odd to generate on-chain SVG metadata
  const handleBet = async () => {
    if (!nftContract || selected === null || !amount || !account) return;
    const ev = MOCK_EVENTS.find((e) => e.id === selected);
    if (!ev) return;

    try {
      setLoading(true);
      const value = parseUnits(amount, 18);

      toast.info("Mintando bilhete da aposta…");
      const tx = await nftContract.mintTicket(
        account,
        selected,
        value,
        ev.title,   // eventName → metadado on-chain
        ev.odd      // odd → metadado on-chain
      );
      await tx.wait();

      toast.success(`Bilhete NFT mintado! 🎟️ Evento: ${ev.title}`);
      setSelected(null);
      setAmount("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao realizar aposta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <CardTitle>Apostas Esportivas</CardTitle>
        </div>
        <CardDescription>Selecione um evento e mintar seu bilhete NFT on-chain</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {MOCK_EVENTS.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelected(ev.id)}
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                selected === ev.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{ev.title}</span>
                <span className="font-mono text-primary">{ev.odd}</span>
              </div>
            </button>
          ))}
        </div>

        <Input
          type="number"
          placeholder="Valor da aposta (BANANA)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!account || loading}
        />

        <Button
          onClick={handleBet}
          disabled={!account || loading || selected === null || !amount}
          className="w-full"
        >
          {loading ? "Mintando NFT…" : "Apostar e Mintar Bilhete"}
        </Button>

        {!account && (
          <p className="text-center text-xs text-muted-foreground">
            Conecte sua carteira para apostar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
