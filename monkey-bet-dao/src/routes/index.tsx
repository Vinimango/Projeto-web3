import { createFileRoute } from "@tanstack/react-router";
import { ContractProvider } from "@/contexts/ContractContext";
import { WalletButton } from "@/components/WalletButton";
import { StakingPanel } from "@/components/StakingPanel";
import { BettingPanel } from "@/components/BettingPanel";
import { DaoPanel } from "@/components/DaoPanel";
import { CoinFlip } from "@/components/CoinFlip";
import { TokenSwap } from "@/components/TokenSwap";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Bet do Macaquinho — Apostas Descentralizadas" },
      {
        name: "description",
        content:
          "MVP Web3 de apostas esportivas com staking, NFT de bilhetes e governança DAO.",
      },
    ],
  }),
});

function Index() {
  return (
    <ContractProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐒</span>
              <h1 className="text-lg font-bold tracking-tight">Bet do Macaquinho</h1>
            </div>
            <WalletButton />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10">
          <section className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Apostas Esportivas <span className="text-primary">Descentralizadas</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              Stake, Aposte, Jogue ou Converta seus tokens em um só lugar!
            </p>
          </section>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <StakingPanel />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
              <BettingPanel />
              <CoinFlip />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
              <TokenSwap />
              <DaoPanel />
            </div>
          </div>
        </main>

        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          🐒 Bet do Macaquinho · MVP Web3 · Powered by ethers.js
        </footer>

        <Toaster />
      </div>
    </ContractProvider>
  );
}
