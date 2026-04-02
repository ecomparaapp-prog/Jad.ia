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
    <header className="sticky top-0 z-50 w-full border-b border-border/60"
      style={{ background: "hsl(var(--sidebar))", backdropFilter: "blur(12px)" }}
    >
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="neu-card-sm h-9 w-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-transform duration-200 group-hover:translate-y-[-1px]">
            <img
              src={theme === 'dark' ? logoBranca : logo}
              alt="Jadi.ia Logo"
              className="h-6 w-6 object-contain"
            />
          </div>
          <span className="font-bold text-base tracking-tight font-mono hidden sm:block">Jadi.ia</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="neu-btn h-9 w-9 flex items-center justify-center bg-card text-foreground"
                data-testid="theme-toggle"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="neu-card border-0 shadow-none">
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
                  className="neu-btn flex items-center gap-2 px-3 py-1.5 bg-card text-foreground text-sm font-medium"
                  data-testid="user-menu-trigger"
                >
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden md:inline-block">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 neu-card border-0 shadow-none">
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
                className="neu-btn px-5 py-2 text-sm font-medium bg-card text-foreground"
                data-testid="link-login"
              >
                Entrar
              </button>
              <button
                onClick={() => setLocation('/registro')}
                className="neu-btn px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground"
                data-testid="link-register"
              >
                Começar grátis
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
