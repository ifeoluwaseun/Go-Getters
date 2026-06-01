"use client";

import React from "react";
import { X } from "lucide-react";

interface SupportCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportCallModal({ open, onOpenChange }: SupportCallModalProps) {
  if (!open) return null;

  const baseCalendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/comfortakintayo/30min";
  const styledCalendlyUrl = `${baseCalendlyUrl}?background_color=0d0d0f&text_color=ffffff&primary_color=00d8fe`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#0d0d0f] border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-200">
        <div className="p-6 border-b border-border/60 flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-primary tracking-tight bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">LET'S BACK YOU UP</h2>
            <p className="text-xs text-muted-foreground">
              We noticed you may need support staying consistent. Let's book a high-value accountability call and remove any roadblocks.
            </p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="w-full bg-[#0d0d0f]" style={{ height: "450px" }}>
          <iframe
            src={styledCalendlyUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            className="w-full h-full bg-[#0d0d0f]"
            title="Schedule Accountability Support Call"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
