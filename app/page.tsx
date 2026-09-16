import LandingPage from '@/components/LandingPage';

export const dynamic = 'force-static';
export const revalidate = false;

export default function Home() {
  return <LandingPage />;
}
