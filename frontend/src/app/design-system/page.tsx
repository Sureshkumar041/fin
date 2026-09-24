import type { Metadata } from 'next';
import { DesignSystemShowcase } from './showcase';

export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false },
};

// Living style guide: every token and component in the current theme.
// Not linked from the app; open /design-system while building UI.
export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
