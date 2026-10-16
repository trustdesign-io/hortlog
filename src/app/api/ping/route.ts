/** Answers at once: lets the offline app check hortlog can be reached before sending someone back. */
export function GET() {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
