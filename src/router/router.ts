    type RouteParams = Record<string, string>;
    type RouteHandler = (
    params: RouteParams,
    query: URLSearchParams,
    ) => void | Promise<void>;

    interface RouteDefinition {
    pattern: string; // например "/movie/:id"
    handler: RouteHandler;
    }

    export class Router {
    #routes: RouteDefinition[];
    #notFoundHandler?: RouteHandler;

    constructor(routes: RouteDefinition[], notFoundHandler?: RouteHandler) {
        this.#routes = routes;
        this.#notFoundHandler = notFoundHandler;

        // "назад"/"вперёд" в браузере — просто пересчитываем маршрут
        // без повторного pushState (история уже обновлена самим браузером)
        window.addEventListener("popstate", () => {
        this.resolve(window.location.pathname, window.location.search);
        });
    }

    // Вызывается один раз при старте приложения — обрабатывает
    // путь, с которым страница была открыта (прямой переход по ссылке)
    start() {
        this.resolve(window.location.pathname, window.location.search);
    }

    // Программный переход: меняет адресную строку и сразу рендерит маршрут
    navigate(path: string) {
        const [pathname, search = ""] = path.split("?");
        const currentPath = window.location.pathname + window.location.search;
        const nextPath = pathname + (search ? `?${search}` : "");

        if (currentPath !== nextPath) {
        window.history.pushState(null, "", path);
        }

        this.resolve(pathname, search ? `?${search}` : "");
    }

    async resolve(pathname: string, search: string) {
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
            await route.handler(params, query);
            return;
        }
        }

        if (this.#notFoundHandler) {
        await this.#notFoundHandler({}, query);
        }
    }
    }