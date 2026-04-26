import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BrowserProvider, Contract, formatEther, type JsonRpcSigner } from "ethers";
import {
  CONTRACT_ADDRESSES,
  DAO_ABI,
  NFT_ABI,
  STAKING_ABI,
  TOKEN_ABI,
  GAME_ABI,
  SWAP_ABI,
  NETWORK_CONFIG,
} from "@/contracts/config";
import { toast } from "sonner";

// 🔌 Tipagem do window.ethereum injetado pela MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

interface ContractContextValue {
  account: string | null;
  balance: string | null;
  bananaBalance: string | null;
  isConnecting: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  // Contratos prontos para uso (read = via provider, write = via signer)
  tokenContract: Contract | null;
  nftContract: Contract | null;
  stakingContract: Contract | null;
  daoContract: Contract | null;
  gameContract: Contract | null;
  swapContract: Contract | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const ContractContext = createContext<ContractContextValue | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [bananaBalance, setBananaBalance] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔗 Conecta com MetaMask e troca de rede automaticamente
  const connectWallet = useCallback(async () => {
    toast.info("Iniciando conexão com a carteira...");
    
    if (typeof window === "undefined" || !window.ethereum) {
      alert("MetaMask não detectada. Instale em https://metamask.io");
      toast.error("MetaMask não detectada.");
      return;
    }
    try {
      setIsConnecting(true);

      // 1. Pede para o usuário conectar as contas primeiro
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      // 2. Pede para trocar para a rede configurada (ex: Localhost 31337 ou Sepolia)
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: NETWORK_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        // Se a rede não existir (código 4902), pede para adicionar
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: NETWORK_CONFIG.chainId,
                  chainName: NETWORK_CONFIG.chainName,
                  rpcUrls: NETWORK_CONFIG.rpcUrls,
                  nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                  blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls,
                },
              ],
            });
          } catch (addError) {
            console.error("Erro ao adicionar a rede:", addError);
            toast.error("Você precisa adicionar a rede à MetaMask.");
            setIsConnecting(false);
            return;
          }
        } else {
          console.error("Erro ao trocar de rede:", switchError);
          toast.error("Você precisa trocar de rede na MetaMask.");
          setIsConnecting(false);
          return;
        }
      }

      // 3. Inicializa o provider e signer com as contas e a rede corretas
      const browserProvider = new BrowserProvider(window.ethereum as never);
      const newSigner = await browserProvider.getSigner();
      const userAddress = accounts[0];
      const rawBalance = await browserProvider.getBalance(userAddress);

      setProvider(browserProvider);
      setSigner(newSigner);
      setAccount(userAddress);
      setBalance(parseFloat(formatEther(rawBalance)).toFixed(4));
    } catch (err) {
      console.error("Erro ao conectar carteira:", err);
      toast.error("Erro ao conectar carteira.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setBananaBalance(null);
    setSigner(null);
    setProvider(null);
  }, []);



  // 👂 Reage a mudanças de conta/rede na MetaMask
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) disconnectWallet();
      else setAccount(accounts[0]);
    };
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnectWallet]);

  // 📦 Instâncias dos contratos
  // → Sem signer: só leitura (view/pure)
  // → Com signer: leitura + escrita (transações)
  const tokenContract = useMemo(() => {
    const runner = signer ?? provider;
    if (!runner) return null;
    return new Contract(CONTRACT_ADDRESSES.TOKEN, TOKEN_ABI, runner);
  }, [signer, provider]);

  const nftContract = useMemo(() => {
    const runner = signer ?? provider;
    if (!runner) return null;
    return new Contract(CONTRACT_ADDRESSES.NFT, NFT_ABI, runner);
  }, [signer, provider]);

  const stakingContract = useMemo(() => {
    const runner = signer ?? provider;
    if (!runner) return null;
    return new Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, runner);
  }, [signer, provider]);

  const daoContract = useMemo(() => {
    const runner = signer ?? provider;
    if (!runner) return null;
    return new Contract(CONTRACT_ADDRESSES.DAO, DAO_ABI, runner);
  }, [signer, provider]);

  // 🔄 Atualiza saldos (ETH e BANANA) sempre que a conta ou contrato mudar
  // ⚠️ DEFINIDO APÓS OS CONTRATOS PARA EVITAR REFERENCE ERROR
  useEffect(() => {
    if (!account || !provider || !tokenContract) return;

    const fetchBalances = async () => {
      try {
        const ethBal = await provider.getBalance(account);
        setBalance(parseFloat(formatEther(ethBal)).toFixed(4));

        const banBal = await tokenContract.balanceOf(account);
        // BANANA tem 18 decimais
        const formattedBan = (Number(banBal) / 1e18).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
        setBananaBalance(formattedBan);
      } catch (err) {
        console.error("Erro ao buscar saldos:", err);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, [account, provider, tokenContract]);

  const value: ContractContextValue = {
    account,
    balance,
    bananaBalance,
    isConnecting,
    provider,
    signer,
    tokenContract,
    nftContract,
    stakingContract,
    daoContract,
    gameContract: useMemo(() => {
      const runner = signer ?? provider;
      if (!runner) return null;
      return new Contract(CONTRACT_ADDRESSES.GAME, GAME_ABI, runner);
    }, [signer, provider]),
    swapContract: useMemo(() => {
      const runner = signer ?? provider;
      if (!runner) return null;
      return new Contract(CONTRACT_ADDRESSES.SWAP, SWAP_ABI, runner);
    }, [signer, provider]),
    connectWallet,
    disconnectWallet,
  };

  return <ContractContext.Provider value={value}>{mounted ? children : null}</ContractContext.Provider>;
}

export function useContracts() {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error("useContracts deve ser usado dentro de <ContractProvider>");
  return ctx;
}
