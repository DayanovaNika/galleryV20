export class Model {
  genresList;
  dataFromServer;
  constructor() {
    this.dataFromServer = null;
    this.genresList = this.getData({
      version: "1",
      chapter: "movie",
      path: "possible-values-by-field",
      params: { field: "genres.name" },
    });
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
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
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
