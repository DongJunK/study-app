"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/learn", label: "학습" },
  { href: "/test", label: "테스트" },
  { href: "/weakness", label: "약점" },
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background shadow-sm dark:shadow-none">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-foreground">
          Study
        </Link>

        {/* Center nav tabs */}
        <nav className="flex h-full items-center gap-1">
          {navItems.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex h-full items-center px-4 text-sm font-medium transition-colors",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side: theme toggle */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
