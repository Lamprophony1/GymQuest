import type { ExceptionTokenType } from '../api/types';
import coinCommit from '../assets/quest-icons/coin-commit.png';
import coinFlex from '../assets/quest-icons/coin-flex.png';
import coinHealth from '../assets/quest-icons/coin-health.png';
import logoMain from '../assets/quest-icons/logo-main.png';
import sideQuest from '../assets/quest-icons/side-quest.png';
import streakGym from '../assets/quest-icons/streak-gym.png';
import streakPerfect from '../assets/quest-icons/streak-perfect.png';

export type QuestIconName =
  | 'logo-main'
  | 'coin-health'
  | 'coin-commit'
  | 'coin-flex'
  | 'streak-perfect'
  | 'streak-gym'
  | 'side-quest';

const questIconSources: Record<QuestIconName, string> = {
  'logo-main': logoMain,
  'coin-health': coinHealth,
  'coin-commit': coinCommit,
  'coin-flex': coinFlex,
  'streak-perfect': streakPerfect,
  'streak-gym': streakGym,
  'side-quest': sideQuest
};

interface QuestIconProps {
  name: QuestIconName;
  className?: string;
  alt?: string;
}

export function questCoinIconName(type: ExceptionTokenType): QuestIconName {
  switch (type) {
    case 0:
      return 'coin-health';
    case 1:
      return 'coin-commit';
    default:
      return 'coin-flex';
  }
}

export function QuestIcon({ name, className, alt }: QuestIconProps) {
  const classNames = ['quest-icon', `quest-icon--${name}`, className].filter(Boolean).join(' ');
  const decorative = alt === undefined;

  return (
    <img
      className={classNames}
      src={questIconSources[name]}
      alt={alt ?? ''}
      aria-hidden={decorative ? true : undefined}
      draggable={false}
    />
  );
}
