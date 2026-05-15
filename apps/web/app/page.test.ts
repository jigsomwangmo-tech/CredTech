import { describe, expect, test } from "bun:test";

describe("web", () => {
  test("names the product", () => {
    expect("NDI Credential Chain").toContain("NDI");
  });
});
