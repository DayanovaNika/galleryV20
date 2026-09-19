type attributesMap = Record<string, string>;

interface ParamsTypes {
  tagName: string;
  text?: string | number;
  classList?: string[];
  attributes?: attributesMap;
}

class Creator {
  #params;
  #element: HTMLElement | HTMLFormElement;

  constructor(paramsElem: ParamsTypes) {
    this.#params = paramsElem;
    this.#element = this.#creatorOfElement();
    this.#setText();
    this.#setClass();
    this.#setAttr();
  }

  #creatorOfElement(): HTMLElement {
    if (!this.#params.tagName) {
      throw new Error("tagName is required to create an element");
    }
    const element = document.createElement(this.#params.tagName);
    return element;
  }

  #setText() {
    if (!this.#params.text && !this.#element) {
      throw new Error("text is not definded");
    }
    if (this.#params.text) {
      this.#element.innerHTML = String(this.#params.text);
    }
  }

  #setClass() {
    if (!this.#params.classList && !this.#element) {
      throw new Error("class is not definded");
    }
    if (this.#params.classList) {
      this.#element.classList.add(...this.#params.classList);
    }
  }

  #setAttr() {
    if (!this.#params.attributes && !this.#element) {
      throw new Error("attributes is not definded");
    }
    if (this.#params.attributes) {
      for (const key in this.#params.attributes) {
        this.#element.setAttribute(key, this.#params.attributes[key]);
      }
    }
  }

  getElement() {
    if (!this.#element) {
      throw new Error("Element is not definded");
    }
    return this.#element;
  }
}

export default Creator;
