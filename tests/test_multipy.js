const multiply = require("../util/multiply");
const { app } = require("../app");
const get_chai = require("../util/get_chai");

describe("testing multiply api", () => {
  it("should multiply two numbers", async () => {
    const { expect, request } = await get_chai();
    expect(multiply(7, 6)).to.equal(42);
  });
  it("should give 6*6 is 36", async () => {
    const { expect } = await get_chai();
    expect(multiply(6, 6)).to.equal(36);
  });
});
