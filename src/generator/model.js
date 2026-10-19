/**
 * Provider-agnostic model-call interface. Keeping this as a small, swappable
 * boundary means the scanner and pipeline capabilities never depend on a
 * specific LLM provider's SDK (design.md decision: "generation step behind
 * a small internal interface").
 *
 * A provider is any function with signature: (prompt: string) => Promise<string>
 */

/**
 * Creates a provider backed by an OpenAI-compatible chat completions
 * endpoint (works for Azure AI Foundry, GitHub Models, OpenAI, and most
 * self-hosted-compatible gateways with minor base-URL/header changes).
 */
export function createOpenAiCompatibleProvider({ endpoint, apiKey, model, fetchImpl = fetch }) {
  return async function callModel(prompt) {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Model call failed: ${response.status} ${response.statusText} ${body}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Model call returned no content");
    }
    return content;
  };
}

/**
 * A deterministic provider for tests and local dry-runs - never calls a
 * real model. Returns a minimal but schema-valid document so downstream
 * validation/stamping logic can be exercised without network access.
 */
export function createMockProvider(sections) {
  return async function callModel() {
    return sections ?? "";
  };
}
