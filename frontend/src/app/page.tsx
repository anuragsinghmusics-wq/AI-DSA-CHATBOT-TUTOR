'use client';

import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

function LoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AppLayout />
    </Suspense>
  );
}
