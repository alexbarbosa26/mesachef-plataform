import type { ReactNode } from 'react';

export type FoundationStatusProps = Readonly<{
  children: ReactNode;
  tone?: 'neutral' | 'operational';
}>;

export function FoundationStatus({
  children,
  tone = 'neutral',
}: FoundationStatusProps) {
  return (
    <span className="mc-foundation-status" data-tone={tone}>
      <span aria-hidden="true" className="mc-foundation-status__dot" />
      {children}
    </span>
  );
}
