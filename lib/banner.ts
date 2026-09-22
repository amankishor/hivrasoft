export const BANNER_SECTIONS = [
  {
    label: "Banner",
    value: "home_hero",
  },
  {
    label:
      "Favourites for a limited time!",
    value: "home_middle",
  },
  {
    label: "Find your fit.",
    value: "home_bottom",
  },
] as const;

export type BannerPosition =
  (typeof BANNER_SECTIONS)[number]["value"];

export const getBannerSectionLabel = (
  position: string
) => {
  return (
    BANNER_SECTIONS.find(
      section =>
        section.value ===
        position
    )?.label || position
  );
};
