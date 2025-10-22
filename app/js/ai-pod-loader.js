// AI POD Loader - minimal wire-up
import "./aipod/runtime-lite.js";
import { mountIntel } from "./aipod/intel-cards.js";
import { wireTools } from "./aipod/tools-wire.js";

document.addEventListener("DOMContentLoaded", () => { 
  mountIntel(); 
  wireTools(); 
}, { once:true });