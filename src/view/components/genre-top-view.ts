    import Creator from "../../core/creator";
    import type { TopMovie } from "../../types/top-types";
    import style from "./styles/genre-top.module.css";

    import {
    listMoviesParams,
    movieParams,
    movieNameParams,
    yearMovieParams,
    } from "./params/slider-params";

    // Класс, который main-view вешает на список, пока над ним виден слайдер
    export const LIST_WITH_SLIDER_CLASS = style.listWithSlider;

    const wrapperParams = {
    tagName: "section",
    classList: [style.wrapper],
    attributes: {},
    };

    const titleParams = {
    tagName: "h2",
    classList: [style.title],
    text: "самые популярные: ",
    attributes: {},
    };

    const genreParams = {
    tagName: "span",
    classList: [style.genre],
    text: "",
    attributes: {},
    };

    // Слайдер «самые популярные» над списком на странице жанра.
    // Сами карточки собираем из тех же параметров, что и в остальных
    // слайдерах (фильмография актёра, похожие фильмы), поэтому они
    // выглядят так же; а обёртка и заголовок — свои, с понятными отступами.
    export class GenreTopView {
    sectionElement: HTMLElement;

    constructor(genreName: string, movies: TopMovie[]) {
        this.sectionElement = this.build(genreName, movies);
    }

    build(genreName: string, movies: TopMovie[]): HTMLElement {
        const wrapper = new Creator(wrapperParams).getElement() as HTMLElement;

        const title = new Creator(titleParams).getElement() as HTMLElement;
        genreParams.text = genreName;
        title.append(new Creator(genreParams).getElement());

        const listMovies = new Creator(listMoviesParams).getElement() as HTMLElement;

        movies.forEach((movie) => {
        let pathToImg = `url(${import.meta.env.BASE_URL}zaglushka.jpg)`;

        if (movie.poster?.previewUrl) {
            pathToImg = `url(${movie.poster.previewUrl})`;
        } else if (movie.poster?.url) {
            pathToImg = `url(${movie.poster.url})`;
        }

        movieParams.attributes.style = `
                    background:
                    linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.5)),
                    ${pathToImg} no-repeat center/cover;`;
        // клик по карточке с data-id уже обрабатывается в контроллере
        // и ведёт на страницу фильма
        movieParams.attributes["data-id"] = String(movie.id);
        const card = new Creator(movieParams).getElement() as HTMLElement;
        listMovies.append(card);

        movieNameParams.text =
            movie.name || movie.alternativeName || "нет имени";
        card.append(new Creator(movieNameParams).getElement());

        yearMovieParams.text = movie.year ? String(movie.year) : "года нет";
        card.append(new Creator(yearMovieParams).getElement());
        });

        wrapper.append(title, listMovies);
        return wrapper;
    }

    getSection(): HTMLElement {
        return this.sectionElement;
    }
    }