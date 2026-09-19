import styleMain from "../styles/main.module.css";
import styleList from "../styles/list-card.module.css";
import stylePrewiew from "../styles/prewiew.module.css";

export const mainParams = {
  tagName: "main",
};
export const listParams = {
  tagName: "ul",
  classList: [styleList.list],
};
export const liParams = {
  tagName: "li",
  classList: [styleList.li],
  attributes: {
    "data-id": "",
  },
};
export const imageParams = {
  tagName: "img",
  classList: [styleList.image],
};
export const containerParams = {
  tagName: "div",
  classList: [styleMain.container],
};
export const loaderContainerParams = {
  tagName: "div",
  classList: [styleMain.loader],
};
export const gifParams = {
  tagName: "img",
  classList: [styleMain.gif],
  attributes: {
    src: "/gif.gif",
  },
};
export const fadeParams = {
  tagName: "div",
  classList: [styleMain.mainFade],
};
export const wrapperInfoParams = {
  tagName: "div",
  classList: [styleList.wrapperInfo],
};
export const ratingWrapperParams = {
  tagName: "div",
  classList: [styleList.ratingWrapper],
};
export const ratingElementParams = {
  tagName: "div",
  classList: [styleList.ratingElement],
};
export const counterRatingParams = {
  tagName: "div",
  text: "",
  classList: [styleList.counterrating],
};
export const iconRatingParams = {
  tagName: "div",
  text: "",
  classList: [styleList.iconRating],
};
export const nameParams = {
  tagName: "div",
  text: "",
  classList: [styleList.name],
};
export const yearParams = {
  tagName: "div",
  text: "",
  classList: [styleList.year],
};
export const criticsNameParams = {
  tagName: "div",
  text: "",
  classList: [styleList.criticsName],
};
export const detailsWrapperParams = {
  tagName: "div",
  classList: [styleList.detailsWrapper],
};
export const prewiewElement = {
  tagName: "div",
  classList: [stylePrewiew.prewiew],
};
