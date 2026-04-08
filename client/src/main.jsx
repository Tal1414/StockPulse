import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PortfolioProvider } from "./hooks/PortfolioContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <PortfolioProvider>
        <App />
      </PortfolioProvider>
    </BrowserRouter>
  </StrictMode>
);
