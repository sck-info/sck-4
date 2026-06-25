import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import VisionMission from "@/components/VisionMission";
import Sessions from "@/components/Sessions";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <VisionMission />
      <Sessions />
      <Testimonials />
      <Contact />
    </>
  );
}
