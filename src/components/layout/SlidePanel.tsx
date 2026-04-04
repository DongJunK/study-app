"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useUiStore } from "@/stores/uiStore";

export function SlidePanel() {
  const isPanelOpen = useUiStore((s) => s.isPanelOpen);
  const closePanel = useUiStore((s) => s.closePanel);

  return (
    <Sheet open={isPanelOpen} onOpenChange={(open) => !open && closePanel()}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>패널</SheetTitle>
          <SheetDescription>추가 정보가 여기에 표시됩니다.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            아직 표시할 내용이 없습니다.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
