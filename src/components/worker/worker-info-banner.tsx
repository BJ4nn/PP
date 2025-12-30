import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function WorkerInfoBanner({ className }: Props) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-amber-500"
        />
        <div>
          <p className="text-base font-semibold text-amber-900">
            Ako funguje párovanie
          </p>
          <p className="text-sm text-amber-900/80">
            Prepnutie režimu „Som pripravený“ dá firmám vedieť, že môžete ísť
            pracovať hneď. Pripravení pracovníci vidia nové ponuky ako prví,
            potom nasledujú najaktívnejší a najspoľahlivejší.
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-3 text-left text-sm font-medium">
        <li>
          O poradí rozhoduje aktivita a spoľahlivosť. Dochádzka zvyšuje skóre,
          rušenie na poslednú chvíľu vás posúva nižšie.
        </li>
        <li>
          Zmeny pribúdajú podľa potreby skladov – berte ich ako doplnkový príjem
          a kombinujte aj s inými brigádami.
        </li>
        <li>
          Prihlášku môžete zrušiť (aj potvrdenú) najneskôr 6 hodín pred
          začiatkom. Neskoršie zrušenia znižujú dôveryhodnosť do budúcna.
        </li>
        <li>
          Majte aktualizovaný profil, dostupnosť aj doklady – zostanete tak v
          skupine „Top match“.
        </li>
      </ul>
    </section>
  );
}
