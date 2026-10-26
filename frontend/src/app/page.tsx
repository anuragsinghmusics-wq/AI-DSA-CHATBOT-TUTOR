import type { Metadata } from 'next';
import { DSASheetPage } from '@/components/sheet/DSASheetPage';

export const metadata: Metadata = {
  title: 'DSA Sheet — Deebug AI Tutor',
  description: 'A structured A2Z DSA problem sheet to master Data Structures and Algorithms. Track your progress, mark problems for revision, and open them directly in the AI-powered editor.',
  keywords: ['DSA', 'A2Z', 'problem sheet', 'algorithms', 'data structures', 'LeetCode', 'Striver'],
};

export default function Home() {
  return <DSASheetPage />;
}
