const CITY_CANONICAL_BY_ALIAS = new Map<string, string>([
  ["bratislava", "Bratislava"],
  ["ivanka pri dunaji", "Bratislava"],
]);

const CITY_GROUPS_BY_CANONICAL = new Map<string, string[]>([
  ["Bratislava", ["Bratislava", "Ivanka pri Dunaji"]],
]);

const normalizeCityKey = (value: string) => value.trim().toLowerCase();

export const getCanonicalCity = (city: string) =>
  CITY_CANONICAL_BY_ALIAS.get(normalizeCityKey(city)) ?? city.trim();

export const getCityFilterVariants = (city: string) => {
  const canonical = getCanonicalCity(city);
  return CITY_GROUPS_BY_CANONICAL.get(canonical) ?? [canonical];
};
