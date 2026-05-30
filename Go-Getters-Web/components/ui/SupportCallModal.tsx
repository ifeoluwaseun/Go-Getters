"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface SupportCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportCallModal({ open, onOpenChange }: SupportCallModalProps) {
  // Configured Calendly URL (or falls back to placeholder demo URL)
  const baseCalendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/gogetters-support";
  
  // Custom query parameters to style the Calendly inline booking widget in dark-mode
  const styledCalendlyUrl = `${baseCalendlyUrl}?background_color=0d0d0f&text_color=ffffff&primary_color=00d8fe`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0d0d0f] border border-border p-6 shadow-2xl overflow-hidden rounded-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-black text-primary tracking-tight">LET'S BACK YOU UP</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            We noticed you may need support staying consistent. Let's book a high-value accountability call and remove any roadblocks.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full rounded-lg overflow-hidden border border-border bg-[#0d0d0f] mt-4" style={{ height: "500px" }}>
          <iframe
            src={styledCalendlyUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            className="w-full h-full bg-[#0d0d0f]"
            title="Schedule Accountability Support Call"
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
}
