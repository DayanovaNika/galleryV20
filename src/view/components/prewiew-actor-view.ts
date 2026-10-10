    import Creator from "../../core/creator";

    import {
    actorCardElementParams,
    actorHeaderParams,
    actorPhotoWrapperParams,
    actorPhotoParams,
    actorInfoColumnParams,
    actorNamePrewiewParams,
    actorProfessionPrewiewParams,
    actorInfoWrapperParams,
    actorCellInfoParams,
    actorTitleInfoParams,
    actorValueInfoParams,
    actorFactsWrapperParams,
    actorFactsTitleParams,
    actorFactsListParams,
    actorFactParams,
    } from "./params/prewiew-actor-params";

    import {
    titleParams,
    createBoxParams,
    sectionParams,
    listMoviesParams,
    movieParams,
    movieNameParams,
    yearMovieParams,
    } from "./params/slider-params";

    class HeaderActorPrewiew {
    headerElement;

    constructor(dataActor) {
        this.headerElement = null;
        this.build(dataActor);
    }

    build(dataActor) {
        this.headerElement = new Creator(actorHeaderParams).getElement();

        const photo = dataActor.photo || "/zaglushka.jpg";
        const photoWrapper = new Creator(actorPhotoWrapperParams).getElement();
        actorPhotoParams.attributes.src = photo;
        actorPhotoParams.attributes.alt =
        dataActor.name || dataActor.enName || "actor photo";
        const photoElement = new Creator(actorPhotoParams).getElement();
        photoWrapper.append(photoElement);
        this.headerElement.append(photoWrapper);

        const infoColumn = new Creator(actorInfoColumnParams).getElement();

        const actorName = dataActor.name || dataActor.enName || "нет имени";
        actorNamePrewiewParams.text = actorName;
        const nameElement = new Creator(actorNamePrewiewParams).getElement();
        infoColumn.append(nameElement);

        const professionText = (dataActor.profession || [])
        .map((item) => item.value)
        .join(", ");
        actorProfessionPrewiewParams.text =
        professionText || "профессия неизвестна";
        const professionElement = new Creator(
        actorProfessionPrewiewParams,
        ).getElement();
        infoColumn.append(professionElement);

        const birthday = dataActor.birthday
        ? new Date(dataActor.birthday).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
            })
        : null;

        const death = dataActor.death
        ? new Date(dataActor.death).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
            })
        : null;

        const birthPlace = (dataActor.birthPlace || [])
        .map((item) => item.value)
        .join(", ");

        const dataInfo: Record<string, string> = {
        ["дата рождения"]: birthday ?? "нет данных",
        ["место рождения"]: birthPlace || "нет данных",
        ["рост"]: dataActor.growth ? `${dataActor.growth} см` : "нет данных",
        ["возраст"]: dataActor.age ? String(dataActor.age) : "нет данных",
        };

        if (death) {
        dataInfo["дата смерти"] = death;
        }

        const infoWrapper = new Creator(actorInfoWrapperParams).getElement();

        Object.entries(dataInfo).forEach(([title, value]) => {
        const cell = new Creator(actorCellInfoParams).getElement();
        actorTitleInfoParams.text = title;
        const titleEl = new Creator(actorTitleInfoParams).getElement();
        actorValueInfoParams.text = value;
        const valueEl = new Creator(actorValueInfoParams).getElement();
        cell.append(titleEl, valueEl);
        infoWrapper.append(cell);
        });

        infoColumn.append(infoWrapper);
        this.headerElement.append(infoColumn);
    }

    getHeader() {
        return this.headerElement;
    }
    }

    class FactsActor {
    factsElement;

    constructor(dataActor) {
        this.factsElement = new Creator(actorFactsWrapperParams).getElement();
        this.build(dataActor);
    }

    build(dataActor) {
        const factsTitle = new Creator(actorFactsTitleParams).getElement();
        const factsList = new Creator(actorFactsListParams).getElement();

        (dataActor.facts || []).forEach((fact) => {
        actorFactParams.text = fact.value;
        const factEl = new Creator(actorFactParams).getElement();
        factsList.append(factEl);
        });

        this.factsElement.append(factsTitle, factsList);
    }

    getFacts() {
        return this.factsElement;
    }
    }

    class FilmographyActor {
    createSection(dataActor) {
        titleParams.text = "filmography";
        const title = new Creator(titleParams).getElement();
        const createBox = new Creator(createBoxParams).getElement();
        const section = new Creator(sectionParams).getElement();

        // listMoviesParams уже несёт data-slider-films — клик по карточке
        // фильма здесь снова попадёт в обработчик фильма в controller
        const listMovies = new Creator(listMoviesParams).getElement();

        (dataActor.movies || []).forEach((element) => {
            let pathToImg = `url(${"/zaglushka.jpg"})`;
                
                
                
            if (element.poster && element.poster.url) {
                console.log(element.poster.url);
                pathToImg = `url(${element.poster.url})`;
            } else if (element.poster && element.poster.previewUrl) {
                console.log(element.poster.previewUrl);
                pathToImg = `url(${element.poster.previewUrl})`;
            }

            movieParams.attributes.style = `
                        background: 
                        linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.5)), 
                        ${pathToImg} no-repeat center/cover;`;
            movieParams.attributes["data-id"] = element.id;
            const movie = new Creator(movieParams).getElement();
            listMovies.append(movie);

            movieNameParams.text =
                element.name || element.alternativeName || "нет имени";
            const movieName = new Creator(movieNameParams).getElement();
            movie.append(movieName);

            yearMovieParams.text =
                element.description || element.enProfession || "роль неизвестна";
            const role = new Creator(yearMovieParams).getElement();
            movie.append(role);
            });

            createBox.append(title, listMovies);
            section.append(createBox);
            return section;
        }
    }

    export class ActorsPrewiew {
    prewiewActorsElement;
    data;

    constructor(dataActor) {
        this.data = dataActor;
        this.prewiewActorsElement = new Creator(actorCardElementParams).getElement();
        this.build(this.data);
    }

    build(dataActor) {
        const header = new HeaderActorPrewiew(dataActor).getHeader();
        const facts = new FactsActor(dataActor).getFacts();
        const filmography = new FilmographyActor().createSection(dataActor);

        this.prewiewActorsElement.append(header, facts, filmography);
    }

    getPrewiew() {
        return this.prewiewActorsElement;
    }
    }