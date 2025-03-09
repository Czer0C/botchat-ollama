export async function GET() {
  const time = new Date().toISOString();

  return new Response(JSON.stringify({ message: 'Ping ' + time }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}
