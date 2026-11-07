import { Cache } from "../cache/cache";
import { ApiError } from "./api-error";
import type { TopByGenre, TopMovie } from "../types/top-types";

// Ключ API берётся из файла .env в корне проекта (переменная VITE_API_KEY),
// а не хранится в коде — .env добавлен в .gitignore и в репозиторий не попадает
const API_KEY = import.meta.env.VITE_API_KEY;

// TTL (время жизни записи в кэше) по типу данных: чем реже данные
// меняются — тем дольше можно держать их в кэше без похода в сеть
const TTL = {
  MOVIE_OR_PERSON: 10*1000, // 30 минут — карточка фильма/актёра
  LIST: 10 * 60 * 1000, // 10 минут — поиск и список по жанру
  GENRES: 24 * 60 * 60 * 1000, // 24 часа — список жанров почти не меняется
};

export class Model {
  genresList;
  dataFromServer;
  actorData;
  #cache = new Cache();

  constructor() {
    this.dataFromServer = null;
    this.genresList = this.getData({
      version: "1",
      chapter: "movie",
      path: "possible-values-by-field",
      params: { field: "genres.name" },
    });
  }

  // Какой TTL назначить ответу — решаем по chapter/path запроса,
  // ничего в сигнатуре getData менять для этого не нужно
  #resolveTtl(chapter: string, path: string): number {
    if (chapter === "movie" && path === "possible-values-by-field") {
      return TTL.GENRES;
    }

    if (chapter === "movie" && (path === "search" || path === "")) {
      return TTL.LIST;
    }

    // /v1.4/movie/{id} и /v1.5/person/{id} — карточки конкретного фильма/актёра
    return TTL.MOVIE_OR_PERSON;
  }

  async getData({
    version = "", // версия
    chapter = "", // например "movie"
    path = "", // например "search" или "possible-values-by-field"
    params = {}, // страницы, количество items и д.р.
    signal = undefined as AbortSignal | undefined, // отмена запроса (см. Router)
  } = {}) {
    const baseURL = "https://api.poiskkino.dev";

    const url = new URL(
      `${baseURL}/v${version}/${chapter}${path ? `/${path}` : ""}`,
    );

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== "") {
            url.searchParams.append(key, String(item));
          }
        });
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    // Кэш проверяем по тем же "сырым" входным параметрам запроса
    // (version/chapter/path/params), а не по готовому url — так ключ
    // не зависит от порядка добавления query-параметров в URL
    const cacheKey = Cache.buildKey({ version, chapter, path, params });
    const cached = this.#cache.get(cacheKey);

    if (cached !== null) {
      return cached;
    }

    if (!API_KEY) {
      throw new Error(
        "Не задан VITE_API_KEY: создайте файл .env в корне проекта (см. .env.example) и перезапустите dev-сервер",
      );
    }

    const options = {
      method: "GET",
      // если signal сработает, fetch бросит AbortError, и до записи в
      // кэш выполнение не дойдёт — отменённый запрос кэш не засоряет
      signal,
      headers: {
        accept: "application/json",
        "X-API-KEY": API_KEY,
      },
    };

    // Ошибку больше не гасим здесь: если fetch упадёт (сеть легла) или
    // сервер ответит не-2xx (например, 404 — такого id нет), промис
    // getData() отклонится, и обрабатывать это будет уже конкретный
    // renderX в контроллере — там понятнее, что показать пользователю
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new ApiError(response.status);
    }

    const data = await response.json();

    // В кэш кладём только успешный ответ — до этой строки не дойдёт,
    // если fetch бросит ошибку или сервер ответит не-2xx (см. throw
    // выше), так что протухший/пустой результат не "залипнет" в кэше
    const ttl = this.#resolveTtl(chapter, path);
    this.#cache.set(cacheKey, data, ttl);

    return data;
  }

  // Топ фильмов по жанрам лежит в статическом файле (его собирает
  // scripts/build-top-by-genre.mjs), поэтому API для слайдера не нужен.
  // Файл читаем один раз и держим результат в памяти
  #topByGenre: Promise<TopByGenre> | null = null;

  async getTopByGenre(genreName: string): Promise<TopMovie[]> {
    if (!this.#topByGenre) {
      this.#topByGenre = fetch(`${import.meta.env.BASE_URL}top-by-genre.json`)
        .then((response) => (response.ok ? response.json() : {}))
        // нет файла или он битый — просто работаем без слайдера
        .catch(() => ({}));
    }

    const all = await this.#topByGenre;
    return all[genreName] ?? [];
  }

  async setData(data) {
    this.dataFromServer = data;
  }

  sortRating(data) {
    data.docs.sort((a, b) => {
      const ratingA = a.rating?.imdb ?? 0;
      const ratingB = b.rating?.imdb ?? 0;

      return ratingB - ratingA;
    });
  }
}