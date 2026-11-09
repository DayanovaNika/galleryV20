    // Разовый скрипт: собирает топ фильмов по каждому жанру и сохраняет
    // в public/top-by-genre.json — именно этот файл читает слайдер
    // «самое популярное» на странице жанра.
    //
    // Запуск из корня проекта:
    //   node scripts/build-top-by-genre.mjs
    //
    // Нужен Node 18+ (встроенный fetch) и ключ в .env: VITE_API_KEY=...
    // Перезапускайте скрипт, когда захотите обновить подборку, и не забудьте
    // закоммитить обновлённый public/top-by-genre.json.

    import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
    import { dirname, resolve } from "node:path";
    import { fileURLToPath } from "node:url";

    // ---- Настройки подборки (можно менять) ----
    const PER_GENRE = 10; // сколько фильмов в слайдере
    const FETCH_LIMIT = 30; // сколько просим у API (с запасом: часть отсеем)
    const MIN_RATING_KP = 8.5; // не брать фильмы с рейтингом Кинопоиска ниже
    const ONLY_MOVIES = false; // true — только фильмы, без сериалов/аниме
    const SKIP_GENRES = ["для взрослых"]; // то же, что скрыто в меню
    const DELAY_MS = 400; // пауза между запросами, чтобы не упереться в лимит
    // -------------------------------------------

    const API_URL = "https://api.poiskkino.dev";
    const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const OUT_FILE = resolve(ROOT, "public/top-by-genre.json");

    const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

    function readApiKey() {
    if (process.env.VITE_API_KEY) {
        return process.env.VITE_API_KEY;
    }

    const envPath = resolve(ROOT, ".env");
    if (!existsSync(envPath)) {
        return null;
    }

    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const match = line.match(/^\s*VITE_API_KEY\s*=\s*(.*?)\s*$/);
        if (match) {
        return match[1].replace(/^["']|["']$/g, "");
        }
    }

    return null;
    }

    const API_KEY = readApiKey();

    if (!API_KEY) {
    console.error(
        "Не найден VITE_API_KEY. Создайте .env в корне проекта (см. .env.example).",
    );
    process.exit(1);
    }

    async function api(path, params = {}, attempt = 1) {
    const url = new URL(`${API_URL}${path}`);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
    }

    try {
        const response = await fetch(url, {
        headers: { accept: "application/json", "X-API-KEY": API_KEY },
        });

        if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
        }

        return await response.json();
    } catch (error) {
        // одна повторная попытка на случай временного сбоя сети
        if (attempt < 2) {
        await sleep(1000);
        return api(path, params, attempt + 1);
        }
        throw error;
    }
    }

    // Оставляем в карточке только то, что нужно слайдеру
    const pick = (movie) => ({
    id: movie.id,
    name: movie.name,
    alternativeName: movie.alternativeName ?? null,
    year: movie.year ?? null,
    rating: { kp: movie.rating?.kp ?? null, imdb: movie.rating?.imdb ?? null },
    poster: {
        url: movie.poster?.url ?? null,
        previewUrl: movie.poster?.previewUrl ?? null,
    },
    });

    const genres = await api("/v1/movie/possible-values-by-field", {
    field: "genres.name",
    });

    const result = {};

    for (const { name } of genres) {
    if (SKIP_GENRES.includes(name.toLowerCase())) {
        continue;
    }

    try {
        const params = {
        "genres.name": name,
        sortField: "votes.kp", // популярность = число оценок на Кинопоиске
        sortType: -1,
        limit: FETCH_LIMIT,
        "rating.kp": `${MIN_RATING_KP}-10`,
        };

        if (ONLY_MOVIES) {
        params.type = "movie";
        }

        const data = await api("/v1.4/movie", params);

        result[name] = (data.docs ?? [])
        .filter((movie) => movie.name && movie.poster?.previewUrl)
        .slice(0, PER_GENRE)
        .map(pick);

        console.log(
        `${name}: ${result[name].length} — ${result[name]
            .map((movie) => movie.name)
            .join(", ")}`,
        );
    } catch (error) {
        console.error(`${name}: ошибка — ${error.message}`);
    }

    await sleep(DELAY_MS);
    }

    mkdirSync(dirname(OUT_FILE), { recursive: true });
    writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), "utf8");

    console.log(`\nГотово: ${Object.keys(result).length} жанров → ${OUT_FILE}`);