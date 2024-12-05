const { sqlForPartialUpdate } = require('./sql'); // Adjust the path as needed
const { BadRequestError } = require('../expressError'); // Adjust the path as needed

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
  } = require("./_testCommon");
  
  beforeAll(commonBeforeAll);
  beforeEach(commonBeforeEach);
  afterEach(commonAfterEach);
  afterAll(commonAfterAll);

describe("sqlForPartialUpdate", () => {
  test("should generate correct SQL for valid input with jsToSql mapping", () => {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name", age: "age" };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("should generate correct SQL for valid input without jsToSql mapping", () => {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = {}; // No mapping provided

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"firstName"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("should handle partial jsToSql mapping", () => {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name" }; // Partial mapping

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("should throw BadRequestError when dataToUpdate is empty", () => {
    const dataToUpdate = {};
    const jsToSql = { firstName: "first_name" };

    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow(BadRequestError);
    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow("No data");
  });

  test("should preserve original key when jsToSql mapping is missing for it", () => {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { age: "age" }; // Only one key mapped

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"firstName"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("should generate correct SQL for single field update", () => {
    const dataToUpdate = { age: 32 };
    const jsToSql = { age: "age" };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"age"=$1',
      values: [32],
    });
  });
});
