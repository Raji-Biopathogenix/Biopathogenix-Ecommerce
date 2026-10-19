// Unsupported discovery files must never fall through to product category pages.
// Real association files can be added as explicit routes when the site needs them.
export function GET() {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
