"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, ClipboardCheck, Target, MessageCircle, Settings } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/learn", label: "학습", icon: BookOpen },
  { href: "/test", label: "테스트", icon: ClipboardCheck },
  { href: "/weakness", label: "약점", icon: Target },
  { href: "/qna", label: "Q&A", icon: MessageCircle },
] as const;

function NavTooltip({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (!collapsed) return null;
  return (
    <span className="pointer-events-none absolute left-full ml-2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-[100] whitespace-nowrap">
      {label}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed } = useSettingsStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  const collapsed = mounted ? sidebarCollapsed : false;

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border bg-card overflow-visible transition-[width] duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b border-border px-3", collapsed && "justify-center")}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-md shadow-emerald-500/20 dark:from-emerald-400/70 dark:to-cyan-400/70 dark:shadow-emerald-400/15">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21V11" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 11C9 11 7 7 9 4C11 4.5 12 7.5 12 11Z" fill="white" opacity="0.9"/>
              <path d="M12 11C15 11 17 7 15 4C13 4.5 12 7.5 12 11Z" fill="white" opacity="0.7"/>
              <path d="M8 21H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-foreground whitespace-nowrap">Seedly</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-2 overflow-visible">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span>{label}</span>}
              <NavTooltip label={label} collapsed={collapsed} />
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings */}
      <div className="border-t border-border p-2 overflow-visible">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground relative whitespace-nowrap",
            pathname === "/settings" && "bg-primary/10 text-primary",
            collapsed && "justify-center px-0"
          )}
        >
          <Settings className="size-[18px] shrink-0" />
          {!collapsed && <span>설정</span>}
          <NavTooltip label="설정" collapsed={collapsed} />
        </Link>
      </div>
    </aside>
  );
}
