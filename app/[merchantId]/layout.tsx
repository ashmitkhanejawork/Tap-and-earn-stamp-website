import type { Metadata } from 'next'
import './stamp.css'

export const metadata: Metadata = {
  title: 'Bean & Brew · Stamp',
  description: 'Collect your loyalty stamps at Bean & Brew',
}

export default function StampLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body {
          background: #F5F0E6 !important;
          color: #1A1612 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>
      {children}
    </>
  )
}
