    import style from "../styles/status.module.css";

    export const statusWrapperParams = {
    tagName: "div",
    classList: [style.statusWrapper],
    attributes: {},
    };

    export const statusTitleParams = {
    tagName: "h2",
    classList: [style.statusTitle],
    text: "",
    attributes: {},
    };

    export const statusMessageParams = {
    tagName: "p",
    classList: [style.statusMessage],
    text: "",
    attributes: {},
    };

    export const statusLinkParams = {
    tagName: "a",
    classList: [style.statusLink],
    text: "На главную",
    attributes: { href: "/", "data-status-home": "true" },
    };