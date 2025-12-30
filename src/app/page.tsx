import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SiteHeader } from "@/components/layout/header";

const workerBenefits = [
  "Okamžitý prístup k extra zmenám bez zdĺhavých zmlúv.",
  "Vyššie hodinové sadzby než v agentúre.",
  "Režim „Som pripravený“ zapnete iba vtedy, keď chcete pracovať.",
];

const companyBenefits = [
  "Žiadna prirážka – pracovníkov platíte priamo.",
  "Overení ľudia s platnými dokumentmi a referenciami.",
  "Ponuky, prihlášky aj potvrdenia spravujete v jednom inboxe.",
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-10 sm:pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-24 right-[-8%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.35),transparent_70%)] blur-3xl" />
          <div className="absolute left-[-12%] top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.25),transparent_70%)] blur-3xl" />
          <div className="absolute bottom-[-10%] right-16 h-60 w-60 rounded-[32%] bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.28),transparent_65%)] blur-2xl" />
        </div>

        <section className="hero-surface relative overflow-hidden rounded-[32px] border border-white/60 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="animate-rise inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <span
                  className="size-2 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                Flexibilná práca v skladoch
              </div>
              <div className="animate-rise animate-delay-150 space-y-4 text-balance">
                <h1 className="font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Spojte sezónny dopyt s overenými pracovníkmi za pár minút.
                </h1>
                <p className="text-base text-slate-600 sm:text-lg">
                  {siteConfig.description} Portál vznikol pre mobilných
                  brigádnikov aj štíhle tímy, ktoré potrebujú mať poriadok v
                  každej zmene.
                </p>
              </div>
              <div className="animate-rise animate-delay-300 flex flex-col gap-3 text-sm font-semibold sm:flex-row">
                <Link
                  href="/auth/register?role=WORKER"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 px-5 py-3 text-center leading-snug text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                >
                  <span className="min-w-0 whitespace-normal">
                    Som pracovník
                  </span>
                  <ArrowRight className="size-4 shrink-0 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/auth/register?role=COMPANY"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-5 py-3 text-center leading-snug text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 sm:w-auto"
                >
                  <span className="min-w-0 whitespace-normal">
                    Zastupujem sklad alebo firmu
                  </span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </Link>
              </div>
              <div className="animate-rise animate-delay-450 flex flex-wrap gap-3 text-xs text-slate-600">
                <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1">
                  Rýchla registrácia
                </span>
                <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1">
                  Overené profily
                </span>
                <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1">
                  Jasné podmienky
                </span>
              </div>
              <p className="animate-rise animate-delay-450 text-xs text-slate-500">
                Už máte účet?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Prihláste sa
                </Link>
                .
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="animate-rise animate-delay-150 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-emerald-700">
                  Pre firmy
                </p>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  Plán smien s reálnou kapacitou
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Vidíte dostupnosť overených ľudí a potvrdíte ich jedným
                  klikom.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2
                    className="size-4 text-emerald-600"
                    aria-hidden="true"
                  />
                  Bez agentúrnych prirážok
                </div>
              </div>
              <div className="animate-rise animate-delay-300 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-sky-700">
                  Pre pracovníkov
                </p>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  Smeny, ktoré sedia vášmu tempu
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Pracujete, keď chcete, a máte prehľad o každej potvrdenej
                  zmene.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2
                    className="size-4 text-sky-600"
                    aria-hidden="true"
                  />
                  Transparentné hodnotenia
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <article className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] animate-rise">
            <div className="absolute right-6 top-6 size-12 rounded-full bg-emerald-100/70 blur-2xl transition group-hover:scale-110" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Sparkles className="size-4" aria-hidden="true" />
                Pre pracovníkov
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                Zarábajte podľa svojich možností
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Vyberte si zmeny, ktoré zapadnú do vášho kalendára, a buďte
                „pripravení“, aby ste boli medzi prvými vo výberoch.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {workerBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 size-4 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-sm">
                <Link
                  href="/worker/dashboard"
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Otvoriť ukážku pracovného prostredia →
                </Link>
              </div>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] animate-rise animate-delay-150">
            <div className="absolute left-6 top-6 size-12 rounded-full bg-sky-100/70 blur-2xl transition group-hover:scale-110" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                <Sparkles className="size-4" aria-hidden="true" />
                Pre firmy
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                Zaplňte zmeny bez chaosu agentúr
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Zverejnite ponuku, pozrite si zoradených uchádzačov a potvrďte
                ich jedným klikom.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {companyBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 size-4 text-sky-600"
                      aria-hidden="true"
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-sm">
                <Link
                  href="/company/jobs"
                  className="font-medium text-sky-700 hover:underline"
                >
                  Otvoriť nástroje pre firmy →
                </Link>
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
