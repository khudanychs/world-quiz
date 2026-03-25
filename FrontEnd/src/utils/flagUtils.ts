const buildFlagUrl = (countryCode: string) => `/circle-flags/${countryCode.toLowerCase()}.svg`;

export const getFlagUrlAsync = async (countryCode: string): Promise<string | null> => {
  return buildFlagUrl(countryCode);
};

export const getFlagUrlSync = (countryCode: string): string | null => {
  return buildFlagUrl(countryCode);
};
