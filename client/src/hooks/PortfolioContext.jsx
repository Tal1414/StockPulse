import { createContext, useContext } from "react";
import { usePortfolio } from "./usePortfolio";

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const portfolio = usePortfolio();
  return (
    <PortfolioContext.Provider value={portfolio}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContext() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolioContext must be inside PortfolioProvider");
  return ctx;
}
