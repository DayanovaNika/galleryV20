    // Отдельный класс ошибки, чтобы контроллер мог отличить "сервер
    // ответил, но с ошибкой" (у неё есть HTTP-статус, например 404 —
    // фильма/актёра с таким id не существует) от обычной сетевой ошибки
    // (сервер вообще не ответил — тут status не будет).
    export class ApiError extends Error {
    status: number;

    constructor(status: number, message?: string) {
        super(message ?? `HTTP error! status: ${status}`);
        this.name = "ApiError";
        this.status = status;
    }
    }