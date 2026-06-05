import ParticleBackground from "./components/layout/ParticleBackground";
import Navbar from "./components/layout/Navbar";
import Hero from "./components/hero/Hero";
import About from "./components/about/About";
import Portfolio from "./components/portfolio/Portfolio";
import Lab from "./components/labs/Lab";
import Contact from "./components/contact/Contact";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <ParticleBackground />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Portfolio />
        <Lab />
        <Contact />
      </main>
    </div>
  );
}
