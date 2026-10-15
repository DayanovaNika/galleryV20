import { Model } from "../model/model";
import { View } from "../view/view";
import { Router } from "../router/router";
import type { Person } from "../types/person-types";

export class Controller {
  model = new Model();
  view;
  router: Router;

  constructor() {
    this.init();
  }

  async init() {
    this.view = new View(await this.model.genresList);
    this.setFormListener();
    this.setListListener();

    // Таблица маршрутов: путь → какой renderX вызвать. Обработчики
    // ничего не знают про клики/события — те же методы дёргаются
    // и при навигации, и при прямом заходе по ссылке.
    this.router = new Router([
      { pattern: "/", handler: () => this.renderHome() },
      {
        pattern: "/movie/:id",
        handler: (params) => this.renderMoviePage(params.id),
      },
      {
        pattern: "/person/:id",
        handler: (params) => this.renderActorPage(params.id),
      },
      {
        pattern: "/genre/:name",
        handler: (params) => this.renderByGenre(params.name),
      },
      {
        pattern: "/search",
        handler: (_params, query) =>
          this.renderSearchResults(query.get("query") ?? ""),
      },
    ]);

    // Разбирает текущий URL при старте — именно это открывает
    // /movie/301 сразу, если вставить такую ссылку в браузер
    this.router.start();
  }

  setFormListener() {
    this.view.headerView.form.addEventListener("submit", (event) =>
      this.formSubmit(event),
    );
  }

  formSubmit(event: SubmitEvent) {
    event.preventDefault();
    const formValue = new FormData(this.view.headerView.form).get(
      "search",
    ) as string;

    this.router.navigate(`/search?query=${encodeURIComponent(formValue)}`);
  }

  // === Рендереры страниц ===
  // Каждый метод самодостаточен: принимает только данные, которые нужны
  // для запроса (id/query/genre), ничего не берёт из event. Их вызывает
  // Router — и по клику (через navigate), и по прямому заходу на URL.

  async renderHome() {
    this.view.mainView.restoreList();
    this.view.mainView.scrollToTop();
  }

  async renderSearchResults(query: string) {
    this.view.mainView.showLoader();

    const response = await this.model.getData({
      version: "1.4",
      chapter: "movie",
      path: "search",
      params: {
        page: 1,
        limit: 12,
        query,
      },
    });

    this.model.setData(response);
    this.model.sortRating(this.model.dataFromServer);
    this.view.mainView.createImageList(this.model.dataFromServer);
    this.view.mainView.removeLoader();
  }

  async renderByGenre(genreName: string) {
    this.view.mainView.showLoader();

    const responseData = await this.model.getData({
      version: "1.4",
      chapter: "movie",
      path: "",
      params: {
        "genres.name": genreName,
        limit: 12,
      },
    });

    this.model.setData(responseData);
    this.model.sortRating(this.model.dataFromServer);
    this.view.mainView.createImageList(this.model.dataFromServer);
    this.view.mainView.removeLoader();
  }

  async renderMoviePage(id: string) {
    this.view.mainView.showLoader();

    const response = await this.model.getData({
      version: "1.4",
      chapter: "movie",
      path: id,
    });

    this.view.mainView.removeLoader();
    this.model.setData(response);
    this.view.mainView.makePrewiew(this.model.dataFromServer);
    this.view.mainView.scrollToTop();
  }

  async renderActorPage(id: string) {
    this.view.mainView.showLoader();

    const personData: Person = await this.model.getData({
      version: "1.5",
      chapter: "person",
      path: id,
    });

    const movieIds = (personData.movies || []).map((movie) => movie.id);

    if (movieIds.length) {
      const postersResponse = await this.model.getData({
        version: "1.4",
        chapter: "movie",
        path: "",
        params: {
          id: movieIds,
          limit: movieIds.length,
        },
      });

      const postersMap = new Map(
        (postersResponse?.docs || []).map((movie) => [movie.id, movie.poster]),
      );

      personData.movies = personData.movies.map((movie) => ({
        ...movie,
        poster: postersMap.get(movie.id) ?? null,
      }));
    }

    this.view.mainView.removeLoader();
    this.model.actorData = personData;
    this.view.mainView.makeActorPrewiew(this.model.actorData);
    this.view.mainView.scrollToTop();
  }

  // === Делегирование событий ===
  // Обработчики только вытаскивают параметры из DOM/event и решают,
  // что сделать с текущим списком на экране — а сам переход отдают
  // роутеру (router.navigate), который меняет URL и вызывает нужный
  // renderX.

  setListListener() {
    this.view.appContainer.addEventListener("click", (event) => {
      if (event.target.closest("[data-value]")) {
        const btnValue = this.view.headerView.getBtnValue(event) as string;
        this.router.navigate(`/genre/${encodeURIComponent(btnValue)}`);
        this.view.headerView.toggleClasses();
      }

      if (event.target.closest("#burger")) {
        this.view.headerView.toggleClasses();
      }

      if (event.target.closest("[data-id]")) {
        const isCard = event.target.closest("[data-id]");
        const isId = isCard ? isCard.getAttribute("data-id") : null;
        const isFromSlider = event.target.closest("[data-slider-films]");

        if (!isFromSlider) {
          this.view.mainView.removeList();
        }

        if (isId) {
          this.router.navigate(`/movie/${isId}`);
        }
      }

      if (event.target.closest("[data-person-id]")) {
        const isPersonCard = event.target.closest("[data-person-id]");
        const isPersonsId = isPersonCard
          ? isPersonCard.getAttribute("data-person-id")
          : null;

        if (isPersonsId) {
          this.router.navigate(`/person/${isPersonsId}`);
        }
      }
    });
  }
}