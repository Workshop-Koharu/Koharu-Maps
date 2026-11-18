import React from 'react';
import { notFound } from 'next/navigation';
import LegalPolicyViewer from '@/components/LegalPolicyViewer';
import { LEGAL_POLICIES } from '@/lib/legal-policies';

export function generateStaticParams() {
  return LEGAL_POLICIES.map((policy) => ({
    slug: policy.slug,
  }));
}

export default function LegalPolicyPage({ params }: { params: { slug: string } }) {
  const policy = LEGAL_POLICIES.find((p) => p.slug === params.slug);

  if (!policy) {
    notFound();
  }

  return <LegalPolicyViewer currentSlug={policy.slug} />;
}
