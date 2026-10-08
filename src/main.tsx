import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/kantumruy-pro/400.css";
import "@fontsource/kantumruy-pro/500.css";
import "@fontsource/kantumruy-pro/700.css";
import "./styles.css";
import { App } from "./App";
import { HotelProvider } from "./state";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");

createRoot(root).render(
  <StrictMode>
    <HotelProvider>
      <App />
    </HotelProvider>
  </StrictMode>,
);
