import Creator from "../../core/creator";
import type { DataTypes } from "../../types/data-types";
import { PreviewView } from "./prewiew-view";
import { ActorsPrewiew } from "./prewiew-actor-view";
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

export class MainView {
  element;
  listElement;
  container;
  loader;
  prewiew;
  prewiewActor;

  constructor() {
    this.element = new Creator(mainParams).getElement();
    this.listElement = new Creator(listParams).getElement();
    this.container = new Creator(containerParams).getElement();
    this.container.append(this.listElement);
    this.element.append(this.container);
    this.loader = this.createLoader();
    this.prewiew = null;
    this.prewiewActor = null;
  }

  createImageList(data: DataTypes) {
    const template = new DocumentFragment();
    this.clear();
    console.log(data);
    
    data.forEach((imageInfo) => {
      liParams.attributes["data-id"] = imageInfo.id;
      const li = new Creator(liParams).getElement();

      const image = new Creator(imageParams).getElement() as HTMLImageElement;
      if (imageInfo.poster && imageInfo.poster.previewUrl) {
        image.src = imageInfo.poster.previewUrl;
      } else {
        image.src = "/zaglushka.jpg";
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

      for (const key in imageInfo.rating) {
        if ((key === "kp" || key === "imdb") && imageInfo.rating[key] > 0) {
          const ratingElement = new Creator(ratingElementParams).getElement();
          const counterRating = new Creator(counterRatingParams).getElement();
          const iconRating = new Creator(iconRatingParams).getElement();
          const criticsName = new Creator(criticsNameParams).getElement();
          criticsName.innerText = `${key}:`;
          ratingWrapper.append(ratingElement);
          ratingElement.append(criticsName, counterRating, iconRating);
          counterRating.innerText = imageInfo.rating[key];
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
    this.listElement.remove();
  }

  makePrewiew(dataCard) {
  if (this.prewiew) {
    this.prewiew.remove(); // убираем старый из DOM
  }
  if (this.prewiewActor) {
    this.prewiewActor.remove(); // убираем страницу актёра, если была открыта
    this.prewiewActor = null;
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
  this.prewiewActor = new ActorsPrewiew(dataActor).getPrewiew();
  this.container.append(this.prewiewActor);
  this.scrollToTop()
}

  scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
}
