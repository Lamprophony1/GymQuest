import { QuestIcon } from './QuestIcon';

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = 'brand-mark__image' }: BrandMarkProps) {
  return <QuestIcon name="logo-main" className={className} />;
}
