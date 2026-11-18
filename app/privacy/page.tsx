import React from 'react';
import LegalPolicyViewer from '@/components/LegalPolicyViewer';

export const metadata = {
  title: '개인정보 처리방침 — Koharu Maps',
  description: 'Koharu Maps 개인정보 처리방침 및 침해 구제 절차 안내',
};

export default function PrivacyPage() {
  return <LegalPolicyViewer currentSlug="privacy" />;
}
