"use client";

import nextDynamic from 'next/dynamic';

const AppSPA = nextDynamic(() => import('./AppSPA'), { ssr: false });

export default function Page() {
  return <AppSPA />;
}
