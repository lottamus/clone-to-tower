import { createRoot } from "react-dom/client";
import "@/assets/styles/tailwind.css";
import { setupStorageSync } from "@/lib/storage";
import Popup from "@/pages/popup/Popup";

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Failed to find root element for popup");

  const root = createRoot(rootContainer);

  setupStorageSync().then(() => {
    root.render(<Popup />);
  });
}

init();
