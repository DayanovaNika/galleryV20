import Creator from "../../core/creator";
import type { DataTypes } from "../../types/data-types";
import { PreviewView } from "./prewiew-view";
import { ActorsPrewiew } from "./prewiew-actor-view";
import { GenreTopView, LIST_WITH_SLIDER_CLASS } from "./genre-top-view";
import type { TopMovie } from "../../types/top-types";
import {
  mainParams,
  listParams,
  containerParams,
  loaderContainerParams,
  gifParams,
  fadeParams,
  liParams,
  imageParams,
  nameParams,
  yearParams,
  ratingElementParams,
  ratingWrapperParams,
  counterRatingParams,
  iconRatingParams,
  criticsNameParams,
  wrapperInfoParams,
  detailsWrapperParams,
} from "./params/main-params";
import {
  statusWrapperParams,
  statusTitleParams,
  statusMessageParams,
  statusLinkParams,
} from "./params/status-params";

export class MainView {
  element;
  listElement;
  container;
  loader;
  prewiew;
  prewiewActor;
  statusView;
  topSlider: HTMLElement | null = null;

  constructor() {
    this.element = new Creator(mainParams).getElement();
    this.listElement = new Creator(listParams).getElement();
    this.container = new Creator(containerParams).getElement();
    this.container.append(this.listElement);
    this.element.append(this.container);
    this.loader = this.createLoader();
    this.prewiew = null;
    this.prewiewActor = null;
    this.statusView = null;
  }

  createImageList(data: DataTypes) {
    const template = new DocumentFragment();
    this.clear();
    console.log(data);

    data.forEach((imageInfo) => {
      liParams.attributes["data-id"] = String(imageInfo.id);
      const li = new Creator(liParams).getElement();

      const image = new Creator(imageParams).getElement() as HTMLImageElement;
      if (imageInfo.poster && imageInfo.poster.previewUrl) {
        image.src = imageInfo.poster.previewUrl;
      } else {
        // BASE_URL учитывает префикс /galleryV20/ на GitHub Pages
        image.src = `${import.meta.env.BASE_URL}zaglushka.jpg`;
      }

      const name = new Creator(nameParams).getElement();
      if (imageInfo.name) {
        name.innerText = imageInfo.name;
      } else {
        name.innerText = "no name";
      }

      const year = new Creator(yearParams).getElement();
      if (imageInfo.year) {
        year.innerText = `год: ${imageInfo.year}`;
      } else {
        year.innerText = "no year";
      }

      const ratingWrapper = new Creator(ratingWrapperParams).getElement();

      // rating в ответе API может отсутствовать — берём пустой объект,
      // а значение читаем через Record, чтобы TypeScript не ругался
      // на возможный undefined
      const rating = (imageInfo.rating ?? {}) as Record<
        string,
        number | undefined
      >;

      for (const key in rating) {
        const value = rating[key];

        if (
          (key === "kp" || key === "imdb") &&
          value !== undefined &&
          value > 0
        ) {
          const ratingElement = new Creator(ratingElementParams).getElement();
          const counterRating = new Creator(counterRatingParams).getElement();
          const iconRating = new Creator(iconRatingParams).getElement();
          const criticsName = new Creator(criticsNameParams).getElement();
          criticsName.innerText = `${key}:`;
          ratingWrapper.append(ratingElement);
          ratingElement.append(criticsName, counterRating, iconRating);
          counterRating.innerText = String(value);
        } else {
          continue;
        }
      }
      const wrapperInfo = new Creator(
        wrapperInfoParams,
      ).getElement() as HTMLElement;
      const detailsWrapper = new Creator(
        detailsWrapperParams,
      ).getElement() as HTMLElement;

      li.append(wrapperInfo);
      detailsWrapper.append(ratingWrapper, year);
      wrapperInfo.append(name, detailsWrapper);
      li.append(image);
      template.append(li);
    });
    this.listElement.append(template);
  }

  clear() {
    this.listElement.innerHTML = "";
  }

  createLoader() {
    const loaderContainer = new Creator(loaderContainerParams).getElement();
    const gif = new Creator(gifParams).getElement();
    const fade = new Creator(fadeParams).getElement();
    loaderContainer.append(gif);
    fade.append(loaderContainer);
    // this.element.append(fade);
    return fade;
  }

  removeLoader() {
    setTimeout(() => {
      // this.loader.classList.add(style.loaderHidden);
      this.loader.remove();
    });
  }

  showLoader() {
    // this.loader.classList.remove(style.loaderHidden)
    this.element.append(this.loader);
  }

  removeList() {
    // слайдер «самое популярное» живёт только рядом со списком
    this.removeGenreTop();
    this.listElement.remove();
  }

  // Слайдер «самое популярное» над списком на странице жанра.
  // Если для жанра нет данных — ничего не показываем
  showGenreTop(genreName: string, movies: TopMovie[]) {
    this.removeGenreTop();

    if (!movies.length || !this.listElement.isConnected) {
      return;
    }

    this.topSlider = new GenreTopView(genreName, movies).getSection();
    this.listElement.before(this.topSlider);
    // пока над списком слайдер, у самого списка убираем верхний отступ
    this.listElement.classList.add(LIST_WITH_SLIDER_CLASS);
  }

  removeGenreTop() {
    // класс снимаем всегда, даже если слайдера уже нет в памяти
    this.listElement.classList.remove(LIST_WITH_SLIDER_CLASS);

    if (this.topSlider) {
      this.topSlider.remove();
      this.topSlider = null;
    }
  }

  // Используется роутером при переходе на "/": убирает открытую
  // карточку фильма/актёра и возвращает список в DOM, если он был
  // изъят оттуда через removeList()
  restoreList() {
    // на главной и в поиске слайдера нет; на странице жанра его покажет
    // renderByGenre уже после этого вызова
    this.removeGenreTop();

    if (this.prewiew) {
      this.prewiew.remove();
      this.prewiew = null;
    }
    if (this.prewiewActor) {
      this.prewiewActor.remove();
      this.prewiewActor = null;
    }
    if (this.statusView) {
      this.statusView.remove();
      this.statusView = null;
    }
    if (!this.listElement.isConnected) {
      this.container.prepend(this.listElement);
    }
  }

  makePrewiew(dataCard) {
  if (this.prewiew) {
    this.prewiew.remove(); // убираем старый из DOM
  }
  if (this.prewiewActor) {
    this.prewiewActor.remove(); // убираем страницу актёра, если была открыта
    this.prewiewActor = null;
  }
  if (this.statusView) {
    this.statusView.remove();
    this.statusView = null;
  }
  this.prewiew = new PreviewView(dataCard).getPrewiew();
  this.container.append(this.prewiew);
}


    makeActorPrewiew(dataActor) {
  if (this.prewiewActor) {
    this.prewiewActor.remove(); // убираем старую страницу актёра, если уже была открыта
  }
  if (this.prewiew) {
    this.prewiew.remove(); // убираем превью фильма, чтобы не копились оба блока разом
    this.prewiew = null;
  }
  if (this.statusView) {
    this.statusView.remove();
    this.statusView = null;
  }
  this.prewiewActor = new ActorsPrewiew(dataActor).getPrewiew();
  this.container.append(this.prewiewActor);
  this.scrollToTop()
}

  // Экран "не найдено" / "ошибка загрузки". kind влияет только на
  // текст по умолчанию — визуально оба варианта выглядят одинаково
  makeStatusView(kind: "not-found" | "error", message?: string) {
    // убираем список, иначе экран статуса дописывается под ним, а не
    // вместо него (как делают страницы фильма и актёра); при следующем
    // переходе на список/поиск/жанр его вернёт restoreList()
    this.removeList();

    if (this.prewiew) {
      this.prewiew.remove();
      this.prewiew = null;
    }
    if (this.prewiewActor) {
      this.prewiewActor.remove();
      this.prewiewActor = null;
    }
    if (this.statusView) {
      this.statusView.remove();
      this.statusView = null;
    }

    const wrapper = new Creator(statusWrapperParams).getElement();

    statusTitleParams.text =
      kind === "not-found" ? "Страница не найдена" : "Не удалось загрузить данные";
    const title = new Creator(statusTitleParams).getElement();

    statusMessageParams.text =
      message ??
      (kind === "not-found"
        ? "Проверьте ссылку — такой фильм, актёр или страница не существует."
        : "Попробуйте обновить страницу чуть позже.");
    const text = new Creator(statusMessageParams).getElement();

    const link = new Creator(statusLinkParams).getElement();

    wrapper.append(title, text, link);
    this.statusView = wrapper;
    this.container.append(this.statusView);
    this.scrollToTop();
  }

  scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
}