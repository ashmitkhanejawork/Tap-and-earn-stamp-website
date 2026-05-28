import { redirect } from 'next/navigation'

// Default merchant — NFC tags link directly to /bean-and-brew?nfc=true&ts=…
// so this only matters for bare visits to the root URL.
export default function RootPage() {
  redirect('/bean-and-brew')
}
