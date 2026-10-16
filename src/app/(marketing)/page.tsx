import { Contact } from "@/components/home/contact";
import { Hero } from "@/components/home/hero";
import { Partners } from "@/components/home/partners";
import { Realisations } from "@/components/home/realisations";
import { Steps } from "@/components/home/steps";
import { Why } from "@/components/home/why";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Steps />
      <Why />
      <Realisations />
      <Partners />
      <Contact />
    </>
  );
}
