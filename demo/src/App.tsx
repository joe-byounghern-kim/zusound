import './app.css'
import { Hero } from './sections/Hero'
import { Demo } from './sections/Demo'
import { Footer } from './sections/Footer'

export function App() {
  return (
    <>
      <a className="skip-link" href="#playground">
        Skip to the example
      </a>
      <main className="page-container">
        <Hero />
        <Demo />
        <Footer />
      </main>
    </>
  )
}
