import { Cache } from "../cache/cache";

// TTL (время жизни записи в кэше) по типу данных: чем реже данные
// меняются — тем дольше можно держать их в кэше без похода в сеть
const TTL = {
  MOVIE_OR_PERSON: 30 * 60 * 1000, // 30 минут — карточка фильма/актёра
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

    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-KEY": "XH5K03S-6N74G06-JGW60VQ-CX7EBBC",
        //   2YDRCN4-GJJ4VXC-HX99D0W-HDBNKW8
      },
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // В кэш кладём только успешный ответ — ошибка сети (см. catch
      // ниже) никогда сюда не доходит, так что протухший/пустой
      // результат не "залипнет" в кэше
      const ttl = this.#resolveTtl(chapter, path);
      this.#cache.set(cacheKey, data, ttl);

      return data;
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      return null;
    }
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