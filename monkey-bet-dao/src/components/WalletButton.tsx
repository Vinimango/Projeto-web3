import { Button } from "@/components/ui/button";
import { useContracts } from "@/contexts/ContractContext";
import { Wallet, LogOut } from "lucide-react";

export function WalletButton() {
  const { account, balance, bananaBalance, isConnecting, connectWallet, disconnectWallet } = useContracts();

  if (account) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end text-xs">
          <div className="flex items-center gap-1 font-bold text-primary">
            <span>{bananaBalance || "0"}</span>
            <span>🍌</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{balance} ETH</span>
          <span className="text-[10px] font-mono text-muted-foreground/60">
            {account.slice(0, 6)}…{account.slice(-4)}
          </span>
        </div>
        <Button variant="outline" size="icon" onClick={disconnectWallet} className="h-8 w-8">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connectWallet} disabled={isConnecting}>
      <Wallet className="h-4 w-4" />
      {isConnecting ? "Conectando…" : "Conectar Carteira"}
    </Button>
  );
}
