import { Model } from "../model/model";
import { View } from "../view/view";
import { Router } from "../router/router";
import type { Person } from "../types/person-types";
import { ApiError } from "../model/api-error";

// Сколько фильмов запрашиваем за один раз при подгрузке постеров
// фильмографии (у API есть верхний предел на limit)
const POSTERS_CHUNK_SIZE = 100;

// API отдаёт фильмографию сгруппированной по профессиям, и у человека
// вроде Брэда Питта первыми идут десятки продюсерских работ, а роли
// актёра — только в конце. Для страницы актёра важнее его роли, поэтому
// выводим их первыми. Остальное остаётся в исходном порядке (sort в
// современных браузерах стабильный)
const PROFESSION_ORDER: Record<string, number> = {
  actor: 0,
  voice_actor: 1,
  himself: 2,
  director: 3,
  writer: 4,
  producer: 5,
};

const professionRank = (enProfession?: string | null): number =>
  enProfession ? (PROFESSION_ORDER[enProfession] ?? 99) : 99;

// Есть ли у фильма путь до картинки (та же проверка, что и при
// отрисовке карточки: url или previewUrl)
const hasPoster = (movie: { poster?: { url?: string; previewUrl?: string } | null }): boolean =>
  Boolean(movie.poster && (movie.poster.url || movie.poster.previewUrl));

// Отмена запроса через AbortController — это не ошибка, а штатная
// ситуация (пользователь ушёл на другую страницу), и показывать для неё
// экран ошибки не нужно
const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

export class Controller {
  model = new Model();
  view;
  router: Router;

  constructor() {
    this.init();
  }

  async init() {
    // Список жанров нужен только для меню. Если запрос упал (нет сети,
    // таймаут, лимит API), страницу всё равно рисуем — просто без
    // жанров, а не оставляем пользователя с пустым экраном
    let genres = [];

    try {
      genres = await this.model.genresList;
    } catch (error) {
      console.error("Не удалось загрузить список жанров:", error);
    }

    this.view = new View(genres);
    this.setFormListener();
    this.setListListener();

    // Таблица маршрутов: путь → какой renderX вызвать. Обработчики
    // ничего не знают про клики/события — те же методы дёргаются
    // и при навигации, и при прямом заходе по ссылке.
    this.router = new Router([
      {
        pattern: "/",
        handler: (_params, _query, signal) => this.renderHome(signal),
      },
      // третьим аргументом роутер передаёт signal — он срабатывает,
      // когда пользователь уходит на другую страницу, и renderX
      // прекращает работу (см. AbortController в Router)
      {
        pattern: "/movie/:id",
        handler: (params, _query, signal) =>
          this.renderMoviePage(params.id, signal),
      },
      {
        pattern: "/person/:id",
        handler: (params, _query, signal) =>
          this.renderActorPage(params.id, signal),
      },
      {
        pattern: "/genre/:name",
        handler: (params, _query, signal) =>
          this.renderByGenre(params.name, signal),
      },
      {
        pattern: "/search",
        handler: (_params, query, signal) =>
          this.renderSearchResults(query.get("query") ?? "", signal),
      },
      ],
      // Срабатывает, если путь вообще не совпал ни с одним паттерном
      // выше (например, опечатка в адресе или ссылка на несуществующий
      // раздел) — это отдельный случай от "фильма/актёра с таким id нет",
      // тот обрабатывается уже внутри renderMoviePage/renderActorPage
      () => this.renderNotFound(),
    );

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

  // Главная: сразу показываем самые известные фильмы с высоким рейтингом.
  // Список общий с поиском и жанрами (тот же listElement), поэтому логика
  // такая же, как в renderByGenre, только без фильтра по жанру
  async renderHome(signal?: AbortSignal) {
    this.view.mainView.showLoader();
    this.view.mainView.restoreList();
    this.view.mainView.scrollToTop();

    try {
      const response = await this.model.getData({
        version: "1.4",
        chapter: "movie",
        path: "",
        params: {
          limit: 12,
          sortField: "rating.kp",
          sortType: -1,
          // только действительно известные фильмы: у них много оценок,
          // поэтому высокий рейтинг не случайный
          "votes.kp": "100000-99999999",
        },
        signal,
      });

      if (signal?.aborted) {
        return;
      }

      this.model.setData(response);
      this.model.sortRating(this.model.dataFromServer);
      this.view.mainView.createImageList(this.model.dataFromServer.docs);
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) {
        return;
      }

      this.view.mainView.makeStatusView(
        "error",
        "Не удалось загрузить фильмы. Проверьте интернет или VPN и обновите страницу.",
      );
      console.error("Ошибка при загрузке главной:", error);
    } finally {
      if (!signal?.aborted) {
        this.view.mainView.removeLoader();
      }
    }
  }

  async renderSearchResults(query: string, signal?: AbortSignal) {
    this.view.mainView.showLoader();
    // убираем открытую страницу фильма/актёра и возвращаем список
    // в DOM, если он был изъят оттуда через removeList()
    this.view.mainView.restoreList();

    try {
      const response = await this.model.getData({
        version: "1.4",
        chapter: "movie",
        path: "search",
        params: {
          page: 1,
          limit: 12,
          query,
        },
        signal,
      });

      // Пока шёл запрос (или ответ пришёл из кэша мгновенно), пользователь
      // мог уйти на другую страницу — устаревший результат не рисуем
      if (signal?.aborted) {
        return;
      }

      this.model.setData(response);
      this.model.sortRating(this.model.dataFromServer);
      this.view.mainView.createImageList(this.model.dataFromServer.docs);
    } catch (error) {
      // отмена запроса — не ошибка, тихо выходим
      if (isAbortError(error) || signal?.aborted) {
        return;
      }

      // у поиска нет "своего" 404 — пустой/неверный запрос это не
      // ошибка API, а просто пустой результат, так что тут всегда
      // общий экран ошибки загрузки
      this.view.mainView.makeStatusView("error");
      console.error("Ошибка при поиске:", error);
    } finally {
      // Лоадер снимаем, только если нас не отменили: иначе мы убрали бы
      // лоадер новой страницы, на которую пользователь уже перешёл
      if (!signal?.aborted) {
        this.view.mainView.removeLoader();
      }
    }
  }

  async renderByGenre(genreName: string, signal?: AbortSignal) {
    this.view.mainView.showLoader();
    // та же причина — страница фильма/актёра могла оставить
    // listElement отключённым от DOM
    this.view.mainView.restoreList();

    // Слайдер «самое популярное» берётся из статического файла и не
    // зависит от основного запроса ниже. Если за это время пользователь
    // ушёл на другую страницу (signal сработал) — уже не показываем
    this.model.getTopByGenre(genreName).then((movies) => {
      if (!signal?.aborted) {
        this.view.mainView.showGenreTop(genreName, movies);
      }
    });

    try {
      const responseData = await this.model.getData({
        version: "1.4",
        chapter: "movie",
        path: "",
        params: {
          "genres.name": genreName,
          limit: 12,
          // сортируем по рейтингу Кинопоиска...
          sortField: "rating.kp",
          sortType: -1,
          // ...но только среди фильмов с заметным числом оценок, иначе
          // наверх попадают нишевые тайтлы со случайно высоким рейтингом
          // при 10-20 голосах
          "votes.kp": "10000-99999999",
        },
        signal,
      });

      if (signal?.aborted) {
        return;
      }

      this.model.setData(responseData);
      this.model.sortRating(this.model.dataFromServer);
      this.view.mainView.createImageList(this.model.dataFromServer.docs);
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) {
        return;
      }

      this.view.mainView.makeStatusView("error");
      console.error("Ошибка при загрузке жанра:", error);
    } finally {
      if (!signal?.aborted) {
        this.view.mainView.removeLoader();
      }
    }
  }

  async renderMoviePage(id: string, signal?: AbortSignal) {
    this.view.mainView.showLoader();
    // сам рендер-метод отвечает за то, чтобы список (с главной/поиска/
    // жанра) не висел в DOM поверх страницы фильма — не важно, пришли
    // мы сюда по клику, по прямой ссылке или через F5
    this.view.mainView.removeList();

    try {
      const response = await this.model.getData({
        version: "1.4",
        chapter: "movie",
        path: id,
        signal,
      });

      if (signal?.aborted) {
        return;
      }

      this.model.setData(response);
      this.view.mainView.makePrewiew(this.model.dataFromServer);
      this.view.mainView.scrollToTop();
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) {
        return;
      }

      // 400 тоже считаем "не найдено": для неверного/выходящего за
      // диапазон id (например /movie/1) API отвечает 400, а не 404
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 400)
      ) {
        this.view.mainView.makeStatusView(
          "not-found",
          "Фильм с таким id не найден.",
        );
      } else {
        this.view.mainView.makeStatusView("error");
      }
      console.error("Ошибка при загрузке фильма:", error);
    } finally {
      if (!signal?.aborted) {
        this.view.mainView.removeLoader();
      }
    }
  }

  async renderActorPage(id: string, signal?: AbortSignal) {
    this.view.mainView.showLoader();
    // та же причина, что и в renderMoviePage — раньше removeList()
    // вызывался только из клика по [data-person-id], а при прямом
    // заходе на /person/:id (например, по F5) клика не было вообще
    this.view.mainView.removeList();

    try {
      const personData: Person = await this.model.getData({
        version: "1.5",
        chapter: "person",
        path: id,
        signal,
      });

      // не тратим запросы за постерами, если пользователь уже ушёл
      if (signal?.aborted) {
        return;
      }

      personData.movies = personData.movies || [];

      const movieIds = personData.movies.map((movie) => movie.id);

      if (movieIds.length) {
        // постеры — это "украшение" страницы, а не критичные данные:
        // если запрос упадёт, показываем актёра как есть, с заглушками
        // вместо постеров, а не всю страницу как ошибку.
        // У актёров с большой фильмографией (сотни работ) один запрос
        // со всеми id API отклоняет (400: превышен limit / слишком длинный
        // URL), поэтому режем id на порции. Один и тот же фильм может
        // встречаться в списке несколько раз (разные профессии) —
        // дубли убираем через Set
        const uniqueIds = [...new Set(movieIds)];
        const chunks: number[][] = [];

        for (let i = 0; i < uniqueIds.length; i += POSTERS_CHUNK_SIZE) {
          chunks.push(uniqueIds.slice(i, i + POSTERS_CHUNK_SIZE));
        }

        // allSettled: если одна порция упадёт, постеры из остальных
        // всё равно подтянутся
        const results = await Promise.allSettled(
          chunks.map((ids) =>
            this.model.getData({
              version: "1.4",
              chapter: "movie",
              path: "",
              params: {
                id: ids,
                limit: ids.length,
              },
              signal,
            }),
          ),
        );

        // за время загрузки постеров пользователь мог уйти — тогда
        // ничего не рисуем (порции при этом уже отменены)
        if (signal?.aborted) {
          return;
        }

        const postersMap = new Map();

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            (result.value?.docs || []).forEach((movie) => {
              postersMap.set(movie.id, movie.poster);
            });
          } else if (!isAbortError(result.reason)) {
            console.error("Не удалось загрузить порцию постеров:", result.reason);
          }
        });

        personData.movies = personData.movies.map((movie) => ({
          ...movie,
          poster: postersMap.get(movie.id) ?? null,
        }));
      }

      // Сортируем уже после подгрузки постеров, потому что нужно знать,
      // у каких фильмов он есть: сначала фильмы с постером, внутри каждой
      // группы — по профессии (актёр → озвучка → ... → продюсер).
      // sort стабильный, поэтому остальной порядок API сохраняется
      personData.movies = [...personData.movies].sort(
        (a, b) =>
          Number(!hasPoster(a)) - Number(!hasPoster(b)) ||
          professionRank(a.enProfession) - professionRank(b.enProfession),
      );

      this.model.actorData = personData;
      this.view.mainView.makeActorPrewiew(this.model.actorData);
      this.view.mainView.scrollToTop();
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) {
        return;
      }

      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 400)
      ) {
        this.view.mainView.makeStatusView(
          "not-found",
          "Актёр с таким id не найден.",
        );
      } else {
        this.view.mainView.makeStatusView("error");
      }
      console.error("Ошибка при загрузке актёра:", error);
    } finally {
      if (!signal?.aborted) {
        this.view.mainView.removeLoader();
      }
    }
  }

  // Вызывается роутером, если путь вообще не совпал ни с одним
  // паттерном (опечатка в адресе, несуществующий раздел и т.д.)
  async renderNotFound() {
    // сюда можно прийти, не дождавшись загрузки другой страницы: её
    // renderX отменён и лоадер уже не уберёт — убираем здесь
    this.view.mainView.removeLoader();
    this.view.mainView.makeStatusView("not-found");
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
        // именно закрываем, а не переключаем: на широком экране меню
        // не открывалось, и toggle оставлял бы классы "открыто", которые
        // проявлялись бы при сужении окна до мобильной ширины
        this.view.headerView.closeMenu();
      }

      if (event.target.closest("#burger")) {
        this.view.headerView.toggleClasses();
      }

      if (event.target.closest("[data-id]")) {
        const isCard = event.target.closest("[data-id]");
        const isId = isCard ? isCard.getAttribute("data-id") : null;

        // removeList() теперь вызывается внутри самого renderMoviePage —
        // так он отрабатывает одинаково и при клике, и при прямом
        // заходе по ссылке/перезагрузке страницы
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

      // Ссылка "На главную" на экране 404/ошибки — перехватываем
      // переход, чтобы роутер сменил вид без полной перезагрузки
      // страницы (обычный <a href="/"> её бы вызвал)
      if (event.target.closest("[data-status-home]")) {
        event.preventDefault();
        this.router.navigate("/");
      }
    });
  }
}