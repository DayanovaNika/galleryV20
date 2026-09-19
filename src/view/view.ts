import { HeaderView } from "./components/header-view";
import { MainView } from "./components/main-view";

export class View {
  appContainer;
  headerView;
  mainView = new MainView();
  constructor(genresList) {
    this.headerView = new HeaderView(genresList);
    this.appContainer = document.querySelector("#app");
    this.buildInterface();
  }
  buildInterface() {
    this.appContainer?.append(this.headerView.header as HTMLElement);
    this.appContainer?.append(this.mainView.element as HTMLElement);
  }
}
