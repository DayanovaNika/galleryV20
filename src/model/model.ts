import { Cache } from "../cache/cache";
import { ApiError } from "./api-error";

const TTL = {
  MOVIE_OR_PERSON: 10*1000, 
  LIST: 10 * 60 * 1000, 
  GENRES: 24 * 60 * 60 * 1000, 
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

  #resolveTtl(chapter: string, path: string): number {
    if (chapter === "movie" && path === "possible-values-by-field") {
      return TTL.GENRES;
    }

    if (chapter === "movie" && (path === "search" || path === "")) {
      return TTL.LIST;
    }

    return TTL.MOVIE_OR_PERSON;
  }

  async getData({
    version = "", 
    chapter = "",
    path = "", 
    params = {}, 
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

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new ApiError(response.status);
    }

    const data = await response.json();

    const ttl = this.#resolveTtl(chapter, path);
    this.#cache.set(cacheKey, data, ttl);

    return data;
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