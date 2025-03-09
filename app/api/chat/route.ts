const OLLAMA_BASE = 'http://localhost:11434/api';

const OLLAMA_CHAT = `${OLLAMA_BASE}/generate`;

const OLLAMA_MODELS = `${OLLAMA_BASE}/tags`;

const rateLimit = 10_000; // 60 seconds per request

const cachedIPs = {};

let lastRequest = 0;

export async function GET() {
  const res = await fetch(OLLAMA_MODELS, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();

  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

// export const revalidate = 0; // ✅ Disable caching, force fresh fetch
// export const dynamic = 'force-dynamic'; // ✅ Force dynamic behavior

export async function POST(req: Request, res: Response) {
  const data = await req.json();

  // const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';

  const { model = 'llama3.2', prompt } = data;

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const elapsed = new Date().getTime() - lastRequest;

  if (lastRequest && elapsed > 0 && elapsed < rateLimit) {
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded, try again in ${
          rateLimit / 1000 - elapsed / 1000
        } seconds ❌`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 429,
      },
    );
  }

  const startTime = new Date();

  const log = `Received request with prompt: **${prompt}** and model ${model} at ${startTime.toISOString()}`;

  console.log(log);

  const stream = new ReadableStream({
    async start(controller) {
      const response = await fetch(OLLAMA_CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt }),
      });

      if (!response.body) {
        controller.close();
        return;
      }

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value); // Stream response chunks
      }

      console.log(
        `Completed request with prompt: **${prompt}** in ${
          new Date().getTime() - startTime.getTime()
        }ms`,
      );

      lastRequest = new Date().getTime();

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
