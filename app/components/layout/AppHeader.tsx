'use client';

import Link from 'next/link';
import type { AuthUser } from '../../hooks/use-auth-session';
import { AuthMenu } from '../dashboard/AuthMenu';

type AppHeaderProps = {
  authUser: AuthUser;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (value: boolean) => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onNavigateClasses: () => void;
  onNavigateCriteria: () => void;
  userMenuRef: React.RefObject<HTMLDivElement | null>;
};

export const AppHeader = ({
  authUser,
  isUserMenuOpen,
  setIsUserMenuOpen,
  onOpenAuth,
  onSignOut,
  onNavigateClasses,
  onNavigateCriteria,
  userMenuRef,
}: AppHeaderProps) => (
  <header className="fixed left-0 right-0 top-0 z-20 border-b border-[var(--fog)] bg-[var(--paper-soft)]">
    <div className="relative flex w-full items-center px-6 py-3">
      <Link
        href="/"
        className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-center"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--graphite)]">
          Plataforma
        </span>
        <span className="text-2xl font-semibold text-[var(--chalk)]">RevisaFácil</span>
      </Link>
      <div className="ml-auto">
        <AuthMenu
          authUser={authUser}
          isUserMenuOpen={isUserMenuOpen}
          setIsUserMenuOpen={setIsUserMenuOpen}
          onOpenAuth={onOpenAuth}
          onSignOut={onSignOut}
          onNavigateClasses={onNavigateClasses}
          onNavigateCriteria={onNavigateCriteria}
          userMenuRef={userMenuRef}
        />
      </div>
    </div>
  </header>
);
