import styleHeader from "../styles/header-style.module.css";
import styleBurger from "../styles/burger.module.css";

export const headerParams = {
  tagName: "header",
  attributes: {
    id: "header",
    "data-action": "header",
  },
  classList: [styleHeader.header],
};
export const formParams = {
  tagName: "form",
  classList: [styleHeader.form],
};
export const inputSearchParams = {
  tagName: "input",
  classList: [styleHeader.inputSearch],
  attributes: {
    type: "search",
    name: "search",
  },
};
export const inputSubmitParams = {
  tagName: "input",
  classList: [styleHeader.inputSubmit],
  attributes: {
    type: "submit",
    value: "",
  },
};
export const wrapperButtonParams = {
  tagName: "div",
  classList: [styleHeader.wrapperButtons],
};
export const containerParams = {
  tagName: "div",
  classList: [styleHeader.container],
};
export const burgerParams = {
  tagName: "button",
  attributes: {
    id: "burger",
  },
  classList: [styleBurger.burger],
};
export const fadeParams = {
  tagName: "div",
  classList: [styleHeader.fade],
};
export const btnContainerParams = {
  tagName: "div",
  text: "",
  classList: [styleHeader.btnContainer],
};
export const burgerLineParams = {
  tagName: "span",
  classList: [styleBurger.burgerLineBase],
};
export const btnParams = {
  tagName: "button",
  text: "",
  attributes: {
    "data-value": "",
  },
  classList: [styleHeader.button],
};
