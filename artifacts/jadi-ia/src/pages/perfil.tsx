import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useListProjects, useGetDashboardStats } from "@workspace/api-client-react";
import { User, Mail, Calendar, Folder, Code2, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Perfil() {
  const { user, logout } = useAuth();
  const { data: projects } = useListProjects();
  const { data: stats } = useGetDashboardStats();

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xl font-bold" data-testid="text-user-name">{user.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  <span data-testid="text-user-email">{user.email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Membro desde {format(new Date(user.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card data-testid="stat-profile-projects">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projetos</p>
                  <p className="text-2xl font-bold">{stats?.totalProjects ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-profile-files">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Arquivos</p>
                  <p className="text-2xl font-bold">{stats?.totalFiles ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {(stats?.languagesUsed?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linguagens Utilizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats?.languagesUsed.map((lang) => (
                  <Badge key={lang.language} variant="secondary" className="capitalize">
                    {lang.language} ({lang.count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <Button
              variant="destructive"
              onClick={logout}
              className="w-full"
              data-testid="button-logout-profile"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
