import Link from "next/link";
import { cn } from "@/lib/utils";
import { tabs, type TabValue } from "@/app/admin/admin-constants";

export function AdminTabs({ activeTab }: { activeTab: TabValue }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.value === "overview" ? "/admin" : `/admin?tab=${tab.value}`}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition",
            activeTab === tab.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

