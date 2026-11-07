    import Creator from "../../core/creator";
    import type { TopMovie } from "../../types/top-types";

    import {
    titleParams,
    createBoxParams,
    sectionParams,
    listMoviesParams,
    movieParams,
    movieNameParams,
    yearMovieParams,
    } from "./params/slider-params";

    // Слайдер «самое популярное» над списком на странице жанра.
    // Карточки собираем из тех же параметров, что и остальные слайдеры
    // (фильмография актёра, похожие фильмы), поэтому и выглядят так же.
    export class GenreTopView {
    sectionElement: HTMLElement;

    constructor(genreName: string, movies: TopMovie[]) {
        this.sectionElement = this.build(genreName, movies);
    }

    build(genreName: string, movies: TopMovie[]): HTMLElement {
        titleParams.text = `самое популярное: ${genreName}`;
        const title = new Creator(titleParams).getElement() as HTMLElement;
        const createBox = new Creator(createBoxParams).getElement() as HTMLElement;
        const section = new Creator(sectionParams).getElement() as HTMLElement;
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

        createBox.append(title, listMovies);
        section.append(createBox);
        return section;
    }

    getSection(): HTMLElement {
        return this.sectionElement;
    }
    }