import dynamic from 'next/dynamic';

export const dynamic = "force-dynamic";

const AppSPA = dynamic(() => import('./AppSPA'), { ssr: false });

export default function Page() {
  return <AppSPA />;
}
