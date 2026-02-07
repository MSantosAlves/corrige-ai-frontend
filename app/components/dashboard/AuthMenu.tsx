'use client';

import type { AuthUser } from '../../hooks/use-auth-session';

type AuthMenuProps = {
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

export const AuthMenu = ({
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
}: AuthMenuProps) => (
  <div className="relative z-10" ref={loginMenuRef}>
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
        onClick={() => setIsLoginMenuOpen(!isLoginMenuOpen)}
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

    {isLoginMenuOpen && !authUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
        <div
          className="w-full max-w-lg rounded-2xl border border-[var(--fog)] bg-white p-7 shadow-xl"
          style={{ width: '110%' }}
          ref={loginMenuRef}
        >
        <div className="flex flex-col gap-4 pb-4">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--graphite)]">
              Plataforma
            </span>
            <span className="text-2xl font-semibold text-[var(--chalk)]">RevisaFácil</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--chalk)]">
            <button
              type="button"
            onClick={() => setAuthMode('sign-in')}
            className={`flex-1 pb-2 text-center ${
              authMode === 'sign-in'
                ? 'border-b-2 border-[var(--chalk)] text-[var(--chalk)]'
                : 'text-[var(--graphite)]'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('sign-up')}
            className={`flex-1 pb-2 text-center ${
              authMode === 'sign-up'
                ? 'border-b-2 border-[var(--chalk)] text-[var(--chalk)]'
                : 'text-[var(--graphite)]'
            }`}
          >
            Cadastrar
          </button>
          </div>
        </div>
        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitAuth(authMode);
          }}
        >
          {authMode === 'sign-up' && (
            <div>
              <label className="text-xs font-semibold text-[var(--graphite)]">Nome</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={authName}
                onChange={(event) => setAuthName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-[var(--graphite)]">Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--graphite)]">Senha</label>
            <input
              type="password"
              placeholder="********"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
            />
          </div>
          {authMode === 'sign-up' && (
            <div>
              <label className="text-xs font-semibold text-[var(--graphite)]">
                Chave de acesso (opcional)
              </label>
              <input
                type="password"
                placeholder="Sua chave de acesso"
                value={authSignUpKey}
                onChange={(event) => setAuthSignUpKey(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={authLoading}
            className="mt-1 rounded-xl bg-[var(--chalk)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--chalk-strong)] disabled:cursor-not-allowed disabled:bg-[var(--fog)]"
          >
            {authLoading ? 'Enviando...' : authMode === 'sign-in' ? 'Entrar' : 'Cadastrar'}
          </button>
          {authError && (
            <span className="text-center text-xs text-[var(--rubric)]">{authError}</span>
          )}
          <button
            type="button"
            onClick={() => onSubmitAuth('sign-in')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--fog)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--chalk)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar com Google
          </button>
        </form>
        </div>
      </div>
    )}
  </div>
);
