export abstract class ParsedHTMLElement extends HTMLElement {
  constructor() {
    super();
    const sr = this.attachShadow({ mode: "closed" });

    const slot = document.createElement("slot");
    sr.appendChild(slot);

    slot.addEventListener(
      "slotchange",
      () => {
        this.parsingFinishedCallback();
      },
      {
        once: true,
      },
    );
  }

  abstract parsingFinishedCallback(): void;
}
