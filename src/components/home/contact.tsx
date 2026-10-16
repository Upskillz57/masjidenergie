import { ArrowRight } from "@/components/icons";
import { site } from "@/lib/site";

export function Contact() {
  const { person, phone, phoneHref, email } = site.contact;

  return (
    <section id="contact" className="bg-brand text-white">
      <div className="mx-auto flex max-w-[1536px] flex-wrap items-center justify-between gap-x-12 gap-y-6 px-[clamp(20px,4.7vw,72px)] py-14">
        <div className="grid max-w-[640px] gap-2.5">
          <span className="text-[13px] font-semibold tracking-[0.26em] text-gold">CONTACT</span>
          <h2 className="text-[clamp(28px,2.6vw,38px)] font-extrabold leading-[1.08] tracking-[-0.02em]">
            Demandez votre étude gratuite.
          </h2>
          <p className="text-base leading-normal text-on-brand">
            {person} ·{" "}
            <a href={phoneHref} className="font-semibold text-white hover:underline">
              {phone}
            </a>{" "}
            ·{" "}
            <a href={`mailto:${email}`} className="text-gold hover:underline">
              {email}
            </a>
          </p>
        </div>
        <a
          href={phoneHref}
          className="flex h-[55px] items-center gap-5 rounded-[10px] bg-white px-7 text-base font-bold text-brand hover:bg-[#f3efe6]"
        >
          Appeler maintenant <ArrowRight className="size-[17px]" />
        </a>
      </div>
    </section>
  );
}
