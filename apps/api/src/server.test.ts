import { describe, expect, test } from "bun:test";

describe("api", () => {
  test("requires NDI consent error code", () => {
    expect("ACCESS_DENIED_NDI_CONSENT_REQUIRED").toContain("NDI_CONSENT");
  });
});
