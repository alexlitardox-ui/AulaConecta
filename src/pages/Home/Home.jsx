import Navbar from "../../components/Navbar/Navbar"
import Hero from "../../components/Hero/Hero"
import Subjects from "../../components/Subjects/Subjects"
import HowItWorks from "../../components/HowItWorks/HowItWorks"
import Stats from "../../components/Stats/Stats"
import CTA from "../../components/CTA/CTA"
import Footer from "../../components/Footer/Footer"

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Subjects />
        <HowItWorks />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

export default Home
