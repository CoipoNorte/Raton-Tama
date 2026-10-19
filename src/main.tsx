import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { prepararGuardado } from "./game/storage";

/**
 * Se espera al almacenamiento (IndexedDB) antes de montar: así la primera
 * partida ya nace con la mascota guardada y sin parpadeos.
 */
async function arrancar() {
  try {
    await prepararGuardado();
  } catch {
    // Si el almacenamiento falla, el juego arranca igualmente en memoria.
  }
  const raiz = document.getElementById("root");
  if (!raiz) return;
  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void arrancar();
