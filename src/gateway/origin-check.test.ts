import { describe, expect, it } from "vitest";
import { checkBrowserOrigin } from "./origin-check.js";

describe("checkBrowserOrigin", () => {
  it("accepts same-origin host matches", () => {
    const result = checkBrowserOrigin({
      requestHost: "127.0.0.1:18789",
      origin: "http://127.0.0.1:18789",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts loopback origins even when gateway is non-loopback", () => {
    expect(
      checkBrowserOrigin({
        requestHost: "device.tail1234.ts.net",
        origin: "http://localhost:3000",
      }).ok,
    ).toBe(true);

    expect(
      checkBrowserOrigin({
        requestHost: "device.tail1234.ts.net",
        origin: "http://127.0.0.1:5173",
      }).ok,
    ).toBe(true);
  });

  it("accepts builtin StoryClaw origins", () => {
    expect(
      checkBrowserOrigin({
        requestHost: "device.tail1234.ts.net",
        origin: "https://storyclaw.com",
      }).ok,
    ).toBe(true);

    expect(
      checkBrowserOrigin({
        requestHost: "device.tail1234.ts.net",
        origin: "https://app.storyclaw.com",
      }).ok,
    ).toBe(true);
  });

  it("accepts allowlisted origins", () => {
    const result = checkBrowserOrigin({
      requestHost: "gateway.example.com:18789",
      origin: "https://control.example.com",
      allowedOrigins: ["https://control.example.com"],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects missing origin", () => {
    const result = checkBrowserOrigin({
      requestHost: "gateway.example.com:18789",
      origin: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects mismatched origins", () => {
    const result = checkBrowserOrigin({
      requestHost: "gateway.example.com:18789",
      origin: "https://attacker.example.com",
    });
    expect(result.ok).toBe(false);
  });
});
