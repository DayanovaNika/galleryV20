    type RouteParams = Record<string, string>;
    // signal — сигнал отмены текущей навигации: когда пользователь уходит на
    // другой маршрут, он срабатывает, и обработчик должен прекратить работу
    // (отменить запросы, не рисовать устаревший результат)
    type RouteHandler = (
    params: RouteParams,
    query: URLSearchParams,
    signal: AbortSignal,
    ) => void | Promise<void>;

    interface RouteDefinition {
    pattern: string; // например "/movie/:id"
    handler: RouteHandler;
    }

    // Префикс, под которым живёт приложение: "/" в dev-режиме и
    // "/galleryV20/" на GitHub Pages (задаётся через base в vite.config).
    // Без хвостового слэша: "" или "/galleryV20"
    const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

    // Реальный путь из адресной строки → путь внутри приложения:
    // "/galleryV20/movie/301" → "/movie/301", чтобы совпадать с шаблонами
    const stripBase = (pathname: string): string => {
    if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
        return pathname.slice(BASE_PATH.length) || "/";
    }
    return pathname;
    };

    export class Router {
    #routes: RouteDefinition[];
    #notFoundHandler?: RouteHandler;
    // Контроллер отмены текущей навигации. На каждый новый resolve
    // предыдущий отменяется, а создаётся новый
    #abortController: AbortController | null = null;

    constructor(routes: RouteDefinition[], notFoundHandler?: RouteHandler) {
        this.#routes = routes;
        this.#notFoundHandler = notFoundHandler;

        // "назад"/"вперёд" в браузере — просто пересчитываем маршрут
        // без повторного pushState (история уже обновлена самим браузером)
        window.addEventListener("popstate", () => {
        this.resolve(
            stripBase(window.location.pathname),
            window.location.search,
        );
        });
    }

    // Вызывается один раз при старте приложения — обрабатывает
    // путь, с которым страница была открыта (прямой переход по ссылке)
    start() {
        this.resolve(stripBase(window.location.pathname), window.location.search);
    }

    // Программный переход: меняет адресную строку и сразу рендерит маршрут.
    // path — путь внутри приложения ("/movie/301"), префикс base
    // добавляется только при записи в адресную строку
    navigate(path: string) {
        const [pathname, search = ""] = path.split("?");
        const currentPath =
        stripBase(window.location.pathname) + window.location.search;
        const nextPath = pathname + (search ? `?${search}` : "");

        if (currentPath !== nextPath) {
        window.history.pushState(null, "", BASE_PATH + path);
        }

        this.resolve(pathname, search ? `?${search}` : "");
    }

    async resolve(pathname: string, search: string) {
        // Новая навигация — отменяем всё, что осталось от предыдущей
        // (запросы, которые ещё в полёте), и выдаём свежий signal
        this.#abortController?.abort();
        const abortController = new AbortController();
        this.#abortController = abortController;
        const signal = abortController.signal;

        const query = new URLSearchParams(search);
        const segments = pathname.split("/").filter(Boolean);

        for (const route of this.#routes) {
        const patternSegments = route.pattern.split("/").filter(Boolean);

        if (patternSegments.length !== segments.length) {
            continue;
        }

        const params: RouteParams = {};
        let matched = true;

        for (let i = 0; i < patternSegments.length; i++) {
            const part = patternSegments[i];
            const segment = segments[i];

            if (part.startsWith(":")) {
            params[part.slice(1)] = decodeURIComponent(segment);
            } else if (part !== segment) {
            matched = false;
            break;
            }
        }

        if (matched) {
            await route.handler(params, query, signal);
            return;
        }
        }

        if (this.#notFoundHandler) {
        await this.#notFoundHandler({}, query, signal);
        }
    }
    }