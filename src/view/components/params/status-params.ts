    import style from "../styles/status.module.css";

    // Простой блок "ничего не найдено" / "ошибка загрузки". Минимальная
    // вёрстка — подгоните цвета/отступы под остальной сайт при желании,
    // структура от этого не изменится.
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
    attributes: {
        href: import.meta.env.BASE_URL,
        "data-status-home": "true",
    },
    };