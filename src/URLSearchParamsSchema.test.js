import URLSearchParamsSchema, { decode, encode } from "./URLSearchParamsSchema";

describe(decode, () => {
  it("turns a query string into an object based on the given schema", () => {
    const queryString =
      "number=1&letter=a&numbers=1&numbers=2&numbers=3&letters=a&letters=b&letters=c";
    const schema = {
      number: Number,
      letter: String,
      numbers: Array(Number),
      letters: Array(String)
    };
    expect(decode(queryString, schema)).toEqual({
      number: 1,
      letter: "a",
      numbers: [1, 2, 3],
      letters: ["a", "b", "c"]
    });
  });

  it("round-trips with encode", () => {
    const queryString =
      "number=1&letter=a&numbers=1&numbers=2&numbers=3&letters=a&letters=b&letters=c";
    const schema = {
      number: Number,
      letter: String,
      numbers: Array(Number),
      letters: Array(String)
    };
    expect(encode(decode(queryString, schema), schema)).toEqual(queryString);
  });
});

describe(encode, () => {
  it("turns an object into a query string based on the given schema", () => {
    const object = {
      number: 1,
      letter: "a",
      numbers: [1, 2, 3],
      letters: ["a", "b", "c"]
    };
    const schema = {
      number: Number,
      letter: String,
      numbers: Array(Number),
      letters: Array(String)
    };
    expect(encode(object, schema)).toEqual(
      "number=1&letter=a&numbers=1&numbers=2&numbers=3&letters=a&letters=b&letters=c"
    );
  });

  it("round-trips with decode", () => {
    const object = {
      number: 1,
      letter: "a",
      numbers: [1, 2, 3],
      letters: ["a", "b", "c"]
    };
    const schema = {
      number: Number,
      letter: String,
      numbers: Array(Number),
      letters: Array(String)
    };
    expect(decode(encode(object, schema), schema)).toEqual(object);
  });
});

describe(URLSearchParamsSchema, () => {
  const schema = new URLSearchParamsSchema({
    number: Number,
    letter: String,
    numbers: Array(Number),
    letters: Array(String)
  });

  describe("#decode", () => {
    it("turns a query string into an object", () => {
      const queryString =
        "number=1&letter=a&numbers=1&numbers=2&numbers=3&letters=a&letters=b&letters=c";
      expect(schema.decode(queryString)).toEqual({
        number: 1,
        letter: "a",
        numbers: [1, 2, 3],
        letters: ["a", "b", "c"]
      });
    });

    it("returns null or empty array for missing params", () => {
      const queryString = "number=1&letters=a&letters=b&letters=c";
      expect(schema.decode(queryString)).toEqual({
        number: 1,
        letter: null,
        numbers: [],
        letters: ["a", "b", "c"]
      });
    });
  });

  describe("#decodeURL", () => {
    it("decodes the query params from a URL", () => {
      const url =
        "http://example.com/page/?number=1&letter=a&numbers=1&numbers=2&numbers=3&letters=a&letters=b&letters=c";
      expect(schema.decodeURL(url)).toEqual({
        number: 1,
        letter: "a",
        numbers: [1, 2, 3],
        letters: ["a", "b", "c"]
      });
    });
  });

  describe("#encode", () => {
    it("turns an object into a query string", () => {
      const object = {
        number: 1,
        letter: "a",
        numbers: [1, 2, 3],
        letters: ["a", "b", "c"]
      };
      expect(schema.encode(object)).toEqual(
        "number=1&letter=a&numbers=1&numbers=2&numbers=3&letters=a&letters=b&letters=c"
      );
    });

    it("skips null and empty arrays", () => {
      const object = {
        number: 1,
        letter: null,
        numbers: [],
        letters: ["a", "b", "c"]
      };
      expect(schema.encode(object)).toEqual(
        "number=1&letters=a&letters=b&letters=c"
      );
    });
  });

  describe("#merge", () => {
    it("produces a new URLSearchParamsSchema that is a merger of the two supplied", () => {
      const urlSearchParamsSchemaA = new URLSearchParamsSchema({
        number: Number,
        numbers: Array(Number)
      });
      const urlSearchParamsSchemaB = new URLSearchParamsSchema({
        letter: String,
        letters: Array(String)
      });

      const newUrlSearchParamsSchema = urlSearchParamsSchemaA.merge(
        urlSearchParamsSchemaB
      );

      expect(newUrlSearchParamsSchema).toStrictEqual(
        new URLSearchParamsSchema({
          number: Number,
          letter: String,
          numbers: Array(Number),
          letters: Array(String)
        })
      );
    });
  });
});
