"use client";

import dynamic from "next/dynamic";

const Sidebar = dynamic(
  () => import("@/components/layout/Sidebar").then((m) => ({ default: m.Sidebar })),
  { ssr: false }
);

export function SidebarWrapper() {
  return <Sidebar />;
}
