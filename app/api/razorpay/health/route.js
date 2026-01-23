export async function GET() {
  try {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', error: String(err) }), { status: 500 });
  }
}

export const runtime = 'edge';
