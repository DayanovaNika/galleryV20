import { Model } from "../model/model";
import { View } from "../view/view";

export class Controller {
  model = new Model();
  view;

  constructor() {
    this.init();
  }

  async init() {
    this.view = new View(await this.model.genresList);
    this.setFormListener();
    this.setListListener();
  }

  setFormListener() {
    this.view.headerView.form.addEventListener("submit", (event) =>
      this.formSubmit(event),
    );
  }

  async formSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.view.mainView.showLoader();
    const formValue = new FormData(this.view.headerView.form).get("search");
    console.log(formValue);

    const response = await this.model.getData({
      version: "1.4",
      chapter: "movie",
      path: "search",
      params: {
        page: 1,
        limit: 12,
        query: formValue,
      },
    });
    this.model.setData(response);
    this.model.sortRating(this.model.dataFromServer);
    this.view.mainView.createImageList(this.model.dataFromServer);
    this.view.mainView.removeLoader();
  }

  async showPrewiew(event) {
    const isCard = event.target.closest("[data-id]");
    const isId = isCard ? isCard.getAttribute("data-id") : null;
    this.view.mainView.showLoader();

    const response = await this.model.getData({
      version: "1.4",
      chapter: "movie",
      path: isId,
    });

    this.view.mainView.removeLoader();
    this.model.setData(response);
    this.view.mainView.makePrewiew(this.model.dataFromServer);
    
    this.view.mainView.scrollToTop();
  }



  setListListener() {
    this.view.appContainer.addEventListener("click", async (event) => {
      if (event.target.closest("[data-value]")) {
        const btnValue = this.view.headerView.getBtnValue(event) as string;
        this.view.mainView.showLoader();

        const responseData = await this.model.getData({
          version: "1.4",
          chapter: "movie",
          path: "",
          params: {
            "genres.name": `${btnValue}`,
            limit: 12,
          },
        });

        console.log("Ответ API по жанру:", responseData);

        this.model.setData(responseData);
        this.model.sortRating(this.model.dataFromServer);
        this.view.mainView.createImageList(this.model.dataFromServer);
        this.view.mainView.removeLoader();
        this.view.headerView.toggleClasses();
      }

      if (event.target.closest("#burger")) {
        this.view.headerView.toggleClasses();
      }

      if (event.target.closest("[data-id]")) {
        const isFromSlider = event.target.closest("[data-slider-films]");

        if (!isFromSlider) {
          this.view.mainView.removeList();
        }

        await this.showPrewiew(event);
      }

      if (event.target.closest("[data-person-id]")) {
          const isPersonsId = event.target.getAttribute("data-person-id")
          console.log(isPersonsId);
          
          const personData: Person = await this.model.getData({
              version: "1.5",
              chapter: "person",
              path: isPersonsId,
          });
          
          this.model.actorData = personData
          this.view.mainView.makeActorPrewiew(this.model.actorData) 
          console.log(this.model.actorData);
      }
    });
  }
}
