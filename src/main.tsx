import { renderDarglarkingHub } from "./darglarkingHub";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element for The Darglarking Yellow.");
}

renderDarglarkingHub(root);
