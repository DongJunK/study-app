"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, ClipboardCheck, Target, MessageCircle, Settings, Briefcase } from "lucide-react";
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
  const [interviewAvailable, setInterviewAvailable] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    fetch("/api/prep/check")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.available) {
          setInterviewAvailable(true);
        }
      })
      .catch(() => {});
  }, []);

  const collapsed = mounted ? sidebarCollapsed : false;

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border bg-card overflow-visible transition-[width] duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex w-16 shrink-0 items-center justify-center">
            <div className="flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-md shadow-emerald-500/20 dark:from-emerald-400/70 dark:to-cyan-400/70 dark:shadow-emerald-400/15">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21V11" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 11C9 11 7 7 9 4C11 4.5 12 7.5 12 11Z" fill="white" opacity="0.9"/>
              <path d="M12 11C15 11 17 7 15 4C13 4.5 12 7.5 12 11Z" fill="white" opacity="0.7"/>
              <path d="M8 21H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            </div>
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-foreground whitespace-nowrap">Seedly</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 py-2 overflow-visible">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap mx-2",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <div className="flex w-12 shrink-0 items-center justify-center">
                <Icon className="size-[18px]" />
              </div>
              {!collapsed && <span>{label}</span>}
              <NavTooltip label={label} collapsed={collapsed} />
            </Link>
          );
        })}
        {interviewAvailable && (
          <Link
            href="/prep"
            className={cn(
              "group flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap mx-2",
              pathname.startsWith("/prep")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <div className="flex w-12 shrink-0 items-center justify-center">
              <Briefcase className="size-[18px]" />
            </div>
            {!collapsed && <span>기술 면접</span>}
            <NavTooltip label="기술 면접" collapsed={collapsed} />
          </Link>
        )}
      </nav>

      {/* Bottom: Settings */}
      <div className="border-t border-border py-2 overflow-visible">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground relative whitespace-nowrap mx-2",
            pathname === "/settings" && "bg-primary/10 text-primary",
          )}
        >
          <div className="flex w-12 shrink-0 items-center justify-center">
            <Settings className="size-[18px]" />
          </div>
          {!collapsed && <span>설정</span>}
          <NavTooltip label="설정" collapsed={collapsed} />
        </Link>
      </div>
    </aside>
  );
}
