export const PET_SPECIES = {
  DOG: "DOG",
  CAT: "CAT",
} as const;

export type PetSpecies = typeof PET_SPECIES[keyof typeof PET_SPECIES];

export type PetOption = {
  id: string;
  name: string;
  species: string;
};

export type PetDocumentType = "狗证" | "登记证" | "免疫证";

export function normalizeSpecies(value?: string | null): PetSpecies {
  return value === PET_SPECIES.CAT ? PET_SPECIES.CAT : PET_SPECIES.DOG;
}

export function speciesLabel(value?: string | null) {
  return normalizeSpecies(value) === PET_SPECIES.CAT ? "猫咪" : "狗狗";
}

export function speciesShortLabel(value?: string | null) {
  return normalizeSpecies(value) === PET_SPECIES.CAT ? "猫" : "狗";
}

export function petOptionLabel(pet: PetOption) {
  return `${pet.name} · ${speciesLabel(pet.species)}`;
}

export function primaryDocumentType(value?: string | null): PetDocumentType {
  return normalizeSpecies(value) === PET_SPECIES.CAT ? "登记证" : "狗证";
}
