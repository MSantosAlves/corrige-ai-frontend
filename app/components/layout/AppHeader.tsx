'use client';

import Link from 'next/link';
import type { AuthUser } from '../../hooks/use-auth-session';
import { AuthMenu } from '../dashboard/AuthMenu';

type AppHeaderProps = {
  authUser: AuthUser;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (value: boolean) => void;
  isLoginMenuOpen: boolean;
  setIsLoginMenuOpen: (value: boolean) => void;
  authMode: 'sign-in' | 'sign-up';
  setAuthMode: (value: 'sign-in' | 'sign-up') => void;
  authName: string;
  setAuthName: (value: string) => void;
  authEmail: string;
  setAuthEmail: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authSignUpKey: string;
  setAuthSignUpKey: (value: string) => void;
  authLoading: boolean;
  authError: string;
  onSubmitAuth: (mode: 'sign-in' | 'sign-up') => void;
  onSignOut: () => void;
  onNavigateClasses: () => void;
  onNavigateCriteria: () => void;
  loginMenuRef: React.RefObject<HTMLDivElement | null>;
  userMenuRef: React.RefObject<HTMLDivElement | null>;
};

export const AppHeader = ({
  authUser,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isLoginMenuOpen,
  setIsLoginMenuOpen,
  authMode,
  setAuthMode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authSignUpKey,
  setAuthSignUpKey,
  authLoading,
  authError,
  onSubmitAuth,
  onSignOut,
  onNavigateClasses,
  onNavigateCriteria,
  loginMenuRef,
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
          isLoginMenuOpen={isLoginMenuOpen}
          setIsLoginMenuOpen={setIsLoginMenuOpen}
          authMode={authMode}
          setAuthMode={setAuthMode}
          authName={authName}
          setAuthName={setAuthName}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authSignUpKey={authSignUpKey}
          setAuthSignUpKey={setAuthSignUpKey}
          authLoading={authLoading}
          authError={authError}
          onSubmitAuth={onSubmitAuth}
          onSignOut={onSignOut}
          onNavigateClasses={onNavigateClasses}
          onNavigateCriteria={onNavigateCriteria}
          loginMenuRef={loginMenuRef}
          userMenuRef={userMenuRef}
        />
      </div>
    </div>
  </header>
);
