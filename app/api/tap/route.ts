import { NextRequest, NextResponse } from 'next/server'

// Always run on each request so the timestamp is fresh.
export const dynamic = 'force-dynamic'

// Physical NFC tags store a static URL. Point the tag at:
//   https://<your-domain>/api/tap?m=bean-and-brew
// This handler injects a fresh unix timestamp and 302-redirects to the
// stamp page, so the NFC validity window always starts at the moment of tap.
export function GET(req: NextRequest) {
  const merchant = req.nextUrl.searchParams.get('m') || 'bean-and-brew'
  const ts = Math.floor(Date.now() / 1000)
  const dest = new URL(`/${merchant}?nfc=true&ts=${ts}`, req.nextUrl.origin)
  return NextResponse.redirect(dest, 302)
}
