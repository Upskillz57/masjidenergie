const figures = [
  { value: "800", label: "abonnés SunLib", gold: false },
  { value: "400+", label: "installateurs certifiés RGE", gold: true },
  { value: "25 M€", label: "levés en janvier 2026", gold: true },
  { value: "24h/24", label: "supervision", gold: false },
];

export function Partners() {
  return (
    <section id="partenaires" className="bg-bg">
      <div
        id="a-propos"
        className="mx-auto grid max-w-[1536px] items-center gap-8 px-[clamp(20px,4.7vw,72px)] py-14 lg:grid-cols-2"
      >
        <div className="grid gap-3">
          <span className="text-[13px] font-semibold tracking-[0.26em] text-gold">
            PARTENAIRES · À PROPOS
          </span>
          <h2 className="text-[clamp(26px,2.1vw,32px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-heading">
            Une solution en partenariat avec{" "}
            <span className="text-brand-text">SunLib</span>.
          </h2>
          <p className="text-[15.5px] leading-[1.55] text-muted">
            SunLib, pionnier de l’abonnement solaire, finance et supervise les installations. Masjid
            Energie accompagne chaque mosquée de l’audit au suivi long terme.
          </p>
          {/* Logo blanc détouré : posé sur le vert du site pour rester lisible en mode clair comme en mode sombre. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 justify-self-start rounded-2xl bg-brand-deep px-6 py-4 shadow-[0_10px_28px_#0a3d2e33] ring-1 ring-white/10">
            <span className="text-[11.5px] font-semibold uppercase leading-tight tracking-[0.2em] text-gold">
              Partenaire
              <br />
              officiel
            </span>
            <span aria-hidden className="h-10 w-px bg-white/20" />
            {/* eslint-disable-next-line @next/next/no-img-element -- logo vectoriel statique */}
            <img src="/images/partenaires/sunlib-blanc.svg" alt="SunLib" width={168} height={60} className="h-[54px] w-auto" />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3.5">
          {figures.map((f) => (
            <div key={f.label} className="flex flex-col-reverse rounded-lg border border-line bg-card p-5">
              <dt className="text-[13px] text-muted">{f.label}</dt>
              <dd className={`text-[30px] font-extrabold ${f.gold ? "text-gold-dark dark:text-gold" : "text-brand-text"}`}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
