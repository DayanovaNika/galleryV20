// COMMON / SHARED TYPES
export interface ImageResource {
  url: string;
  previewUrl: string;
}

export interface MoneyValue {
  value: number;
  currency: string;
}

export interface NamedEntity {
  name: string;
}

export interface ExternalId {
  imdb?: string;
  kpHD?: string;
  tmdb?: number;
}

// AUDIENCE
export interface Audience {
  count: number;
  country: string;
}

// AWARDS
export interface AwardMeta {
  title?: string;
  year?: number;
}

export interface AwardInfo {
  award?: AwardMeta;
  title: string;
}

export interface Award {
  nomination: AwardInfo;
  winning: boolean;
}

// FACTS
export interface MovieFact {
  value: string;
  type: string;
  spoiler: boolean;
}

// PERSONS
export interface MoviePerson {
  id: number;
  name?: string;
  enName?: string;
  photo?: string;
  profession: string;
  enProfession?: string;
}

// MOVIE NAMES
export interface MovieName {
  name: string;
  language?: string | null;
  type: string;
}

// RELEASE DATES
export interface Premiere {
  world?: string;
  russia?: string;
  dvd?: string;
  bluray?: string;
}

// RATINGS
export interface Rating {
  kp?: number;
  imdb?: number;
  filmCritics?: number;
  russianFilmCritics?: number;
}

export interface Votes {
  kp?: number;
  imdb?: number;
  filmCritics?: number;
  russianFilmCritics?: number;
}

// FEES
export interface Fees {
  world?: MoneyValue;
  usa?: MoneyValue;
  russia?: MoneyValue;
}

// TECHNOLOGY
export interface Technology {
  has3D?: boolean;
  hasImax?: boolean;
}

// DISTRIBUTORS
export interface Distributors {
  distributor?: string;
}

// RELATED / SIMILAR MOVIES
export interface RelatedMovie {
  id: number;
  name: string;
  alternativeName?: string | null;
  type: string;
  year?: number;
  relationType?: string;
  poster?: ImageResource;
  rating?: {
    kp?: number;
  };
}

// MAIN MOVIE RESPONSE
export interface MovieApiResponse {
  id: number;
  name: string;
  alternativeName?: string | null;
  description?: string;
  shortDescription?: string;
  slogan?: string | null;

  year?: number;
  movieLength?: number;
  ageRating?: number;

  type: string;
  typeNumber?: number;
  isSeries?: boolean;

  ratingMpaa?: string | null;
  top250?: number;

  createdAt?: string;
  updatedAt?: string;

  poster?: ImageResource;
  backdrop?: ImageResource;
  logo?: ImageResource;

  budget?: MoneyValue;
  fees?: Fees;

  rating?: Rating;
  votes?: Votes;

  externalId?: ExternalId;

  premiere?: Premiere;
  distributors?: Distributors;

  countries?: NamedEntity[];
  genres?: NamedEntity[];
  names?: MovieName[];

  audience?: Audience[];
  awards?: Award[];
  facts?: MovieFact[];
  persons?: MoviePerson[];

  similarMovies?: RelatedMovie[];
  sequelsAndPrequels?: RelatedMovie[];

  lists?: string[];

  hasOttFeatures?: boolean;
  hasSkippableFragments?: boolean;
  ticketsOnSale?: boolean;

  technology?: Technology;
}

// API LIST RESPONSE
export interface MovieApiListResponse {
  docs: MovieApiResponse[];
  total: number;
  limit: number;
  page: number;
  pages: number;
}
