export interface PersonFactValue {
  value: string;
}

export interface PersonSpouse {
  id: number;
  name: string;
  divorced: boolean;
  divorcedReason: string;
  sex: string;
  children: number;
  relation: string;
}

export interface PersonProfession {
  value: string;
  professionId: number;
}

export interface PersonMovie {
  id: number;
  name: string | null;
  alternativeName: string | null;
  rating: number | null;
  general: boolean | null;
  description: string | null;
  enProfession: string;
  professionId: number;
  // Поле не приходит из /v1.5/person/{id} — подмешивается вручную
  // отдельным запросом к /v1.4/movie по списку id (см. Controller.renderActorPage)
  poster?: { url?: string; previewUrl?: string } | null;
}

export interface Person {
  id: number;
  name: string | null;
  enName: string | null;
  photo: string | null;
  sex: string | null;
  growth: number | null;
  birthday: string | null;
  death: string | null;
  age: number | null;
  birthPlace: PersonFactValue[];
  deathPlace: PersonFactValue[];
  spouses: PersonSpouse[];
  countAwards: number;
  profession: PersonProfession[];
  facts: PersonFactValue[];
  movies: PersonMovie[];
  updatedAt: string;
  createdAt: string;
}
