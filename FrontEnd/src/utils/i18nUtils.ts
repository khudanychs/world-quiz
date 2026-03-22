export const getLocalizedName = (
  properties: Record<string, any>,
  currentLanguage: string,
  defaultKey: string = 'name'
): string => {
  const localizedKey = `${defaultKey}_${currentLanguage}`;
  if (properties[localizedKey] && properties[localizedKey].trim() !== '') {
    return properties[localizedKey];
  }
  return properties[defaultKey] || 'Unknown';
};
