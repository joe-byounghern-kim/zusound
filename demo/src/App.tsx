import './app.css'
import { Hero } from './sections/Hero'
import { Demo } from './sections/Demo'
import { ApiDocs } from './sections/ApiDocs'
import { Footer } from './sections/Footer'

export function App() {
  return (
    <>
      <div className="backdrop" aria-hidden="true" />
      <main className="page-container">
        <Hero />
        <Demo />
        <ApiDocs />
        <Footer />
      </main>
    </>
  )
}
