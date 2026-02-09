'use client';

import type { AuthUser } from '../../hooks/use-auth-session';

type AuthMenuProps = {
  authUser: AuthUser;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (value: boolean) => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onNavigateClasses: () => void;
  onNavigateCriteria: () => void;
  userMenuRef: React.RefObject<HTMLDivElement | null>;
};

export const AuthMenu = ({
  authUser,
  isUserMenuOpen,
  setIsUserMenuOpen,
  onOpenAuth,
  onSignOut,
  onNavigateClasses,
  onNavigateCriteria,
  userMenuRef,
}: AuthMenuProps) => (
  <div className="relative z-10">
    {authUser ? (
      <div className="relative" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--chalk)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--chalk-strong)]"
        >
          {authUser.name}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4 text-white"
            fill="currentColor"
          >
            <path d="M5.5 7.5 10 12l4.5-4.5" />
          </svg>
        </button>
        {isUserMenuOpen && (
          <div className="absolute right-0 mt-3 w-52 rounded-xl border border-[var(--fog)] bg-white p-2 shadow-lg">
            {['Perfil', 'Minhas turmas', 'Critérios de avaliação', 'Sair'].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (label === 'Sair') {
                    onSignOut();
                  }
                  if (label === 'Minhas turmas') {
                    onNavigateClasses();
                  }
                  if (label === 'Critérios de avaliação') {
                    onNavigateCriteria();
                  }
                  setIsUserMenuOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--wash)]"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    ) : (
      <button
        type="button"
        onClick={onOpenAuth}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--chalk)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--chalk-strong)]"
      >
        Entrar
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4 text-white"
          fill="currentColor"
        >
          <path d="M5.5 7.5 10 12l4.5-4.5" />
        </svg>
      </button>
    )}
  </div>
);
