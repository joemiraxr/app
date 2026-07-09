import { describe, it, expect } from "vitest";
import { toUserMessage } from "./errors";

describe("toUserMessage", () => {
  it("maps 401 to a permission/session message", () => {
    expect(toUserMessage({ response: { status: 401 } })).toMatch(
      /permission|sign in|session/i,
    );
  });

  it("maps 403 to a permission/session message", () => {
    expect(toUserMessage({ response: { status: 403 } })).toMatch(
      /permission|sign in|session/i,
    );
  });

  it("maps 404 to a not-found message", () => {
    expect(toUserMessage({ response: { status: 404 } })).toMatch(
      /couldn.?t find|not found/i,
    );
  });

  it("maps 429 to a rate-limit message", () => {
    expect(toUserMessage({ response: { status: 429 } })).toMatch(
      /too many|wait a moment/i,
    );
  });

  it("maps 5xx to a server-problem message", () => {
    expect(toUserMessage({ response: { status: 503 } })).toMatch(
      /server|try again/i,
    );
  });

  it("reads a status from `status` directly (not just `response.status`)", () => {
    expect(toUserMessage({ status: 401 })).toMatch(/permission|sign in|session/i);
  });

  it("treats a response-less request error as a network problem", () => {
    expect(toUserMessage({ code: "ERR_NETWORK" })).toMatch(
      /reach the server|connection/i,
    );
  });

  it("falls back to a generic message for an unknown error", () => {
    expect(toUserMessage(new Error("boom"))).toMatch(/something went wrong/i);
    expect(toUserMessage("weird")).toMatch(/something went wrong/i);
    expect(toUserMessage(undefined)).toMatch(/something went wrong/i);
  });

  it("NEVER leaks the raw error text to the returned message", () => {
    const secret = "SELECT * FROM users; connection refused at 10.0.0.5:5432";
    const err = Object.assign(new Error(secret), { response: { status: 500 } });
    const msg = toUserMessage(err);
    expect(msg).not.toContain(secret);
    expect(msg).not.toMatch(/SELECT|10\.0\.0\.5|refused/);
  });
});
