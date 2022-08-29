import mapValues from "lodash/mapValues";

export function decode(searchParams, schema) {
  const urlSearchParams = new URLSearchParams(searchParams);

  // By mapping over `schema`, we ensure that every property
  // specified in the schema is included, even if a corresponding
  // value was not specified in the URL.
  return mapValues(schema, (spec, key) => {
    const isArray = Array.isArray(spec);
    const decodeValue = isArray ? spec[0] : spec;

    if (isArray) {
      return urlSearchParams.getAll(key).map(decodeValue);
    }

    const value = urlSearchParams.get(key);
    if (value == null) return null;
    return decodeValue(value);
  });
}

const encodeValue = String;

export function encode(obj, schema) {
  const searchParams = new URLSearchParams();

  for (const [key, spec] of Object.entries(schema)) {
    const value = obj[key];
    const isArray = Array.isArray(spec);

    // Skip empty values
    if ((isArray && value.length === 0) || value == null) continue;

    if (isArray) {
      for (const v of value) searchParams.append(key, encodeValue(v));
    } else {
      searchParams.append(key, encodeValue(value));
    }
  }
  return searchParams.toString();
}

export default class URLSearchParamsSchema {
  constructor(schema) {
    for (const [key, property] of Object.entries(schema)) {
      if (!property) {
        throw new TypeError(
          `Attempted to create a URLSearchParamsSchema but \`${key}\` has no type specified`
        );
      }
      if (!(Array.isArray(property) || [Number, String].includes(property))) {
        throw new TypeError(
          `Attempted to create a URLSearchParamsSchema with an unsupported type for \`${key}\` (${property.name})`
        );
      }
    }
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
