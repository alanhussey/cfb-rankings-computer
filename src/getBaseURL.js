export default function getBaseURL(url) {
  const paramsAndHashLength = url.search.length + url.hash.length;
  return url.href.slice(0, -paramsAndHashLength);
}
