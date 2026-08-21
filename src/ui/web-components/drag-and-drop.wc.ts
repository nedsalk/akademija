import { ParsedHTMLElement } from "./parsed-html-element.wc";

export class DragAndDrop extends ParsedHTMLElement {
  dragged!: HTMLElement;

  dropTargets!: HTMLElement[];

  override parsingFinishedCallback(): void {
    this.addEventListener("dragstart", this.start);
    this.addEventListener("dragenter", this.enter);
    this.addEventListener("dragend", this.end);
  }

  public start(e: DragEvent) {
    const target = e.target as HTMLElement;

    this.dragged = target;
    this.dropTargets = Array.from(
      (target.parentElement?.childNodes ?? []) as Iterable<HTMLElement>,
    ).filter((sibling) => sibling.draggable);
  }

  public enter(e: Event) {
    const dropTarget = (e.target as Element).closest("[draggable]") as HTMLElement;

    if (!this.dropTargets.includes(dropTarget)) {
      return;
    }

    const prevDropTarget = this.dropTargets.find((el) => el.dataset.dropPosition);
    delete prevDropTarget?.dataset.dropPosition;

    if (dropTarget === this.dragged) {
      return;
    }

    const position: InsertPosition =
      this.dropTargets.indexOf(this.dragged) > this.dropTargets.indexOf(dropTarget)
        ? "beforebegin"
        : "afterend";

    dropTarget.dataset.dropPosition = position;
  }

  end() {
    const dropTarget = this.dropTargets.find((el) => el.dataset.dropPosition);
    if (!dropTarget) return;

    const position = dropTarget.dataset.dropPosition as InsertPosition;
    delete dropTarget.dataset.dropPosition;
    dropTarget.insertAdjacentElement(position, this.dragged);
    this.highlightReorderedElement(this.dragged);
  }

  private highlightReorderedElement(element: HTMLElement) {
    element.classList.remove("is-reordering");
    void element.offsetWidth;
    element.classList.add("is-reordering");
    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove("is-reordering");
      },
      { once: true },
    );
  }
}

customElements.define("drag-and-drop", DragAndDrop);
