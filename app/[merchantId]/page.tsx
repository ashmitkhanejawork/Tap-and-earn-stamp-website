import { Suspense } from 'react'
import { StampApp } from './StampClient'

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
