import '@/styles/globals.css'
import { SignerProvider } from '../context/SignerContext'

export default function App({ Component, pageProps }) {
  return (
    <SignerProvider>
      <Component {...pageProps} />
    </SignerProvider>
  )
}
