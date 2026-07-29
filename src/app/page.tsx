import NamasteIntro from "@/components/NamasteIntro";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import VisionMission from "@/components/VisionMission";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Gallery from "@/components/Gallery";

export default function Home() {
  return (
    <>
      <NamasteIntro />
      <main id="main-content">
        <Navbar />
        <Hero />
        <About />
        <VisionMission />
        <Gallery />
        <Testimonials />
        <Contact />
      </main>
    </>
  );
}
