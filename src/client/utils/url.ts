export function appendUrlQueryParams(
  url: string,
  params: Record<string, string>
) {
  const urlObj = new URL(url);
  Object.keys(params).forEach((key) => {
    urlObj.searchParams.append(key, params[key]);
  });
  return urlObj.toString();
}

export function getUrlQueryParams(url: string) {
  const urlObj = new URL(url);
  const params: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
