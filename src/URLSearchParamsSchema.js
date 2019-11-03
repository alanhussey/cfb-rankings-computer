import mapValues from "lodash/mapValues";

export function decode(searchParams, schema) {
  const urlSearchParams = new URLSearchParams(searchParams);
  return mapValues(schema, (spec, key) => {
    const isArray = Array.isArray(spec);
    const hydrator = isArray ? spec[0] : spec;

    if (isArray) {
      return urlSearchParams.getAll(key).map(hydrator);
    }

    const value = urlSearchParams.get(key);
    if (value == null) return null;
    return hydrator(value);
  });
}

export function encode(obj, schema) {
  const searchParams = new URLSearchParams();
  for (const [key, spec] of Object.entries(schema)) {
    const value = obj[key];
    const isArray = Array.isArray(spec);

    // Skip empty values
    if ((isArray && value.length === 0) || value == null) continue;

    const values = isArray ? value.map(String) : [String(value)];
    for (const value of values) searchParams.append(key, value);
  }
  return searchParams.toString();
}

export default class URLSearchParamsSchema {
  constructor(schema) {
    this.schema = schema;
  }
  decode(searchParams) {
    return decode(searchParams, this.schema);
  }
  decodeURL(url) {
    return this.decode(new URL(url).search);
  }
  encode(object) {
    return encode(object, this.schema);
  }
  merge(other) {
    return new URLSearchParamsSchema({
      ...this.schema,
      ...other.schema
    });
  }
}
