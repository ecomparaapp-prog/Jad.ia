import React from 'react';
import { useAuth } from '@/lib/auth';
import { Link, useLocation } from 'wouter';
import { LogOut, User, Moon, Sun, Monitor, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/theme-provider';
import logoBranca from '@assets/logo_sem_fundo_branca_1775101885588.jpg';
import logo from '@assets/logo_sem_fundo_1775101885589.png';

export function Navbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 pt-3 pb-2">
        <div
          className="rounded-[2rem] px-5 h-16 flex items-center justify-between"
          style={{
            background: theme === 'dark' ? 'rgba(240,240,245,0.07)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: theme === 'dark' ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          {/* Logo esquerda */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div
              className="h-8 w-8 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 rounded-xl overflow-hidden"
              style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
            >
              <img
                src={theme === 'dark' ? logoBranca : logo}
                alt="Jad.ia Logo"
                className="h-5 w-5 object-contain"
              />
            </div>
          </Link>

          {/* Centro: nome + tagline */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center leading-none pointer-events-none select-none">
            <span
              className="font-extrabold tracking-tight"
              style={{
                fontFamily: 'var(--app-font-serif)',
                fontSize: '1.35rem',
                color: '#22c55e',
                lineHeight: 1.1,
              }}
            >
              Jad.ia
            </span>
            <span
              className="text-[10px] font-semibold tracking-wide mt-0.5"
              style={{ color: '#f97316' }}
            >
              Sua IA de Vibe Coding
            </span>
          </div>

          {/* Direita: tema + usuário */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-foreground"
                  data-testid="theme-toggle"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Alternar tema</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card-md border-0 shadow-none" style={{ borderRadius: '1.25rem' }}>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" /> Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" /> Escuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-4 w-4" /> Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                    data-testid="user-menu-trigger"
                  >
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: 'var(--gradient-primary)' }}
                    >
                      <span className="text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden md:inline-block font-semibold">{user.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card-md border-0 shadow-none" style={{ borderRadius: '1.25rem' }}>
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="w-[200px] truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/dashboard')} data-testid="link-dashboard">
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/perfil')} data-testid="link-profile">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive" data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLocation('/login')}
                  className="px-4 py-2 text-sm rounded-xl font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  data-testid="link-login"
                >
                  Entrar
                </button>
                <button
                  onClick={() => setLocation('/registro')}
                  className="btn-primary px-5 py-2 text-sm"
                  data-testid="link-register"
                >
                  Começar grátis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
