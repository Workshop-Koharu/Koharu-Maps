import React from 'react';
import LegalPolicyViewer from '@/components/LegalPolicyViewer';

export const metadata = {
  title: '서비스 이용약관 — Koharu Maps',
  description: 'Koharu Maps 서비스 이용약관 및 법적 고지',
};

export default function TermsPage() {
  return <LegalPolicyViewer currentSlug="terms" />;
}
