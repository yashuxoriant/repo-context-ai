import { describe, it, expect, vi } from "vitest";
import { createOpenAiCompatibleProvider, createMockProvider } from "../../src/generator/model.js";

describe("createOpenAiCompatibleProvider", () => {
  it("calls the configured endpoint and returns the model's text content", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "generated text" } }] })
    });

    const callModel = createOpenAiCompatibleProvider({
      endpoint: "https://example.test/v1/chat/completions",
      apiKey: "test-key",
      model: "test-model",
      fetchImpl
    });

    const result = await callModel("a prompt");

    expect(result).toBe("generated text");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.test/v1/chat/completions",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws a descriptive error when the endpoint responds with a failure", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "boom"
    });

    const callModel = createOpenAiCompatibleProvider({
      endpoint: "https://example.test",
      apiKey: "k",
      model: "m",
      fetchImpl
    });

    await expect(callModel("prompt")).rejects.toThrow(/Model call failed: 500/);
  });
});

describe("createMockProvider", () => {
  it("can swap in for the real provider without changing calling code", async () => {
    const callModel = createMockProvider("## Overview\nstub");
    const result = await callModel("any prompt - ignored by mock");
    expect(result).toBe("## Overview\nstub");
  });
});
