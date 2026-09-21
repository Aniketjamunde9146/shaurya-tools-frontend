export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const REQUEST_TIMEOUT = 60000;

async function request(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The AI request timed out. Please try again.");
    }
    throw new Error("Unable to reach the AI backend. Check your connection and try again.");
  } finally {
    clearTimeout(timeoutId);
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
  const response = await request(`${API_URL}/api/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, input }),
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
