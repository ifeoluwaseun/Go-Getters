import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Go-Getters | High-Performance Execution System",
  description: "Join the elite execution network. Organize your goals, track daily tasks, upload progress evidence, and rise on the community win board.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const removeAttrs = (node) => {
                  if (node.nodeType === 1) {
                    if (node.hasAttribute('bis_skin_checked')) node.removeAttribute('bis_skin_checked');
                    if (node.hasAttribute('bis_register')) node.removeAttribute('bis_register');
                    const elements = node.querySelectorAll('[bis_skin_checked], [bis_register]');
                    for (let i = 0; i < elements.length; i++) {
                      elements[i].removeAttribute('bis_skin_checked');
                      elements[i].removeAttribute('bis_register');
                    }
                  }
                };

                const observer = new MutationObserver((mutations) => {
                  for (let i = 0; i < mutations.length; i++) {
                    const mutation = mutations[i];
                    if (mutation.type === 'childList') {
                      for (let j = 0; j < mutation.addedNodes.length; j++) {
                        removeAttrs(mutation.addedNodes[j]);
                      }
                    } else if (mutation.type === 'attributes') {
                      const target = mutation.target;
                      if (target.nodeType === 1) {
                        if (target.hasAttribute('bis_skin_checked')) target.removeAttribute('bis_skin_checked');
                        if (target.hasAttribute('bis_register')) target.removeAttribute('bis_register');
                      }
                    }
                  }
                });

                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['bis_skin_checked', 'bis_register']
                });
              })();
            `
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-foreground min-h-screen antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
