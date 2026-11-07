// Карточка фильма в файле public/top-by-genre.json (его собирает
// scripts/build-top-by-genre.mjs)
export interface TopMovie {
  id: number;
  name?: string | null;
  alternativeName?: string | null;
  year?: number | null;
  rating?: { kp?: number | null; imdb?: number | null };
  poster?: { url?: string | null; previewUrl?: string | null } | null;
}

// Ключ — название жанра ("драма"), значение — топ фильмов этого жанра
export type TopByGenre = Record<string, TopMovie[]>;