export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const REQUEST_TIMEOUT = 60000;
const MAX_RETRIES = 2;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function normalizeInput(tool, input) {
  if (!/^[A-Za-z0-9_-]+$/.test(tool)) {
    throw new Error("Invalid AI tool name.");
  }

  if (typeof input === "string" && input.trim()) return input.trim();

  if (input && typeof input === "object") {
    return `Generate a professional ${tool} result.

User requirements:
${JSON.stringify(input, null, 2)}

Return only the final result. Do not explain your process.`;
  }

  throw new Error("Please provide complete instructions for the AI tool.");
}

async function request(url, options) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < MAX_RETRIES) {
        await wait(500 * (attempt + 1));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        if (error.name === "AbortError") {
          throw new Error("The AI request timed out after several attempts. Please try again.");
        }
        throw new Error("Unable to reach the AI backend after several attempts. Check your connection and try again.");
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

export const generateAI = async (tool, input) => {
  const completeInput = normalizeInput(tool, input);
  const response = await request(`${API_URL}/api/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, input: completeInput }),
  });

  return { data: await parseResponse(response) };
};

export async function streamLandingPage(input, onChunk) {
  const response = await request(`${API_URL}/api/ai/landing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: JSON.stringify(input) }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || payload.message || `Landing page generation failed (${response.status})`);
  }

  if (!response.body) throw new Error("The backend returned an empty stream.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let html = "";

  const processLine = (line) => {
    if (!line.startsWith("data:")) return false;

    const data = line.replace(/^data:\s*/, "");
    if (data === "[DONE]") return true;

    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      return false;
    }
    if (payload.error) throw new Error(payload.error);

    const delta = payload.choices?.[0]?.delta?.content || "";
    if (delta) {
      html += delta;
      onChunk(html);
    }
    return false;
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (processLine(line.trim())) {
        if (!html) throw new Error("The backend returned an empty landing page stream.");
        return html;
      }
    }
    if (done) break;
  }

  if (buffer.trim()) processLine(buffer.trim());
  if (!html) throw new Error("The backend returned an empty landing page stream.");
  return html;
}
