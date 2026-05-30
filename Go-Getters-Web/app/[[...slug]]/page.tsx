"use client";

import dynamic from 'next/dynamic';

const AppSPA = dynamic(() => import('./AppSPA'), { ssr: false });

export default function Page() {
  return <AppSPA />;
}
