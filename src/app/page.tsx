import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import VisionMission from "@/components/VisionMission";
import Sessions from "@/components/Sessions";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Gallery from "@/components/Gallery";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <VisionMission />
      <Sessions />
      <Gallery />
      <Testimonials />
      <Contact />
    </>
  );
}
