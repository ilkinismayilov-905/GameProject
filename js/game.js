import { PROJECT_NAME } from "./constants.js";

export class Game {
  constructor(root = document) {
    this.root = root;
    this.name = PROJECT_NAME;
  }

  init() {
    this.root.documentElement.dataset.appReady = "true";
  }
}
