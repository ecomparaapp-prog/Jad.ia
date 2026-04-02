import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Registro from "@/pages/registro";
import Dashboard from "@/pages/dashboard";
import NovoProjeto from "@/pages/novo-projeto";
import Editor from "@/pages/editor";
import Perfil from "@/pages/perfil";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const err = error as { status?: number };
        if (err?.status === 401 || err?.status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, token } = useAuth();
  const [, setLocation] = useLocation();

  if (!token) {
    return <Redirect to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function EditorRoute() {
  const { user, isLoading, token } = useAuth();

  if (!token) return <Redirect to="/login" />;
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;

  return <Editor />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AppLayout>
          <Home />
        </AppLayout>
      )} />
      <Route path="/login" component={() => <Login />} />
      <Route path="/registro" component={() => <Registro />} />
      <Route path="/dashboard" component={() => (
        <AppLayout>
          <ProtectedRoute component={Dashboard} />
        </AppLayout>
      )} />
      <Route path="/projetos/novo" component={() => (
        <AppLayout>
          <ProtectedRoute component={NovoProjeto} />
        </AppLayout>
      )} />
      <Route path="/projetos/:id" component={() => (
        <AppLayout>
          <EditorRoute />
        </AppLayout>
      )} />
      <Route path="/perfil" component={() => (
        <AppLayout>
          <ProtectedRoute component={Perfil} />
        </AppLayout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
