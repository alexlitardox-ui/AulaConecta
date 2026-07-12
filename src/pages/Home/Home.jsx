import Navbar from "../../components/Navbar/Navbar"
import Hero from "../../components/Hero/Hero"
import Subjects from "../../components/Subjects/Subjects"
import HowItWorks from "../../components/HowItWorks/HowItWorks"
import Stats from "../../components/Stats/Stats"
import CTA from "../../components/CTA/CTA"
import Footer from "../../components/Footer/Footer"

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Subjects />
      <HowItWorks />
      <Stats />
      <CTA />
      <Footer />
    </>
  )
}

export default Home