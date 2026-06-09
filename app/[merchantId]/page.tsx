import { Suspense } from 'react'
import { StampApp } from './StampClient'

// Render on each request so the URL search params (?nfc=true&ts=…) are always
// available to the client component instead of being baked into a static page.
export const dynamic = 'force-dynamic'

export default function StampPage({
  params: _params,
}: {
  params: { merchantId: string }
}) {
  return (
    <Suspense
      fallback={
        <div style={{
          background: '#F5F0E6',
          minHeight: '100dvh',
        }} />
      }
    >
      <StampApp />
    </Suspense>
  )
}
