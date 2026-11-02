import { Contact } from "@/components/home/contact";
import { Hero } from "@/components/home/hero";
import { Partners } from "@/components/home/partners";
import { Sadaqa } from "@/components/home/sadaqa";
import { Services } from "@/components/home/services";
import { Steps } from "@/components/home/steps";
import { Verse } from "@/components/verse";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <section aria-label="Verset" className="bg-bg-tint px-5 pb-2 pt-10">
        <Verse reference="10:5">
          C’est Lui qui a fait du soleil une clarté et de la lune une lumière…
        </Verse>
      </section>
      <Steps />
      <Sadaqa />
      <Partners />
      <Contact />
    </>
  );
}
