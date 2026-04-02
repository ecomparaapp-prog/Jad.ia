import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListProjects,
  useDeleteProject,
  useGetDashboardStats,
  useGetRecentActivity,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Plus,
  Folder,
  Trash2,
  Edit3,
  Globe,
  Lock,
  Code2,
  Activity,
  LayoutDashboard,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  python: "#3776ab",
  html: "#e34f26",
  css: "#264de4",
  react: "#61dafb",
  vue: "#42b883",
  "node.js": "#339933",
  "next.js": "#000000",
  "react native": "#61dafb",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: projects, isLoading: loadingProjects } = useListProjects();
  const { data: stats, isLoading: loadingStats } = useGetDashboardStats();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity();

  const deleteProject = useDeleteProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: "Projeto deletado com sucesso" });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Erro ao deletar projeto", variant: "destructive" });
      },
    },
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Bem-vindo, {user?.name}
              </p>
            </div>
            <Button onClick={() => setLocation("/projetos/novo")} data-testid="button-new-project">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loadingStats ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card data-testid="stat-total-projects">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Folder className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Projetos</p>
                        <p className="text-2xl font-bold">{stats?.totalProjects ?? 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card data-testid="stat-total-files">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Code2 className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Arquivos</p>
                        <p className="text-2xl font-bold">{stats?.totalFiles ?? 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card data-testid="stat-recent-projects">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Projetos Recentes</p>
                        <p className="text-2xl font-bold">{stats?.recentProjectsCount ?? 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Meus Projetos</h2>
              <span className="text-sm text-muted-foreground">{projects?.length ?? 0} projetos</span>
            </div>

            {loadingProjects ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : projects?.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-dashed border-border rounded-xl p-12 text-center"
              >
                <Folder className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum projeto ainda</p>
                <Button onClick={() => setLocation("/projetos/novo")} data-testid="button-create-first-project">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro projeto
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {projects?.map((project, i) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className="hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/projetos/${project.id}`)}
                        data-testid={`card-project-${project.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: (LANGUAGE_COLORS[project.language.toLowerCase()] ?? "#6366f1") + "20" }}
                              >
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: LANGUAGE_COLORS[project.language.toLowerCase()] ?? "#6366f1" }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold truncate" data-testid={`text-project-name-${project.id}`}>{project.name}</p>
                                {project.description && (
                                  <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <Badge variant="outline" className="text-xs capitalize hidden sm:flex">
                                {project.language}
                              </Badge>
                              {project.isPublic ? (
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground hidden md:block">
                                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: ptBR })}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/projetos/${project.id}`);
                                }}
                                data-testid={`button-edit-project-${project.id}`}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(project.id);
                                }}
                                data-testid={`button-delete-project-${project.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividade Recente
            </h2>
            {loadingActivity ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : activity?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
            ) : (
              <div className="space-y-2">
                {activity?.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-card text-sm"
                    data-testid={`activity-item-${item.id}`}
                  >
                    <p className="font-medium text-xs">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(stats?.languagesUsed?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Linguagens em uso</h3>
                <div className="space-y-2">
                  {stats?.languagesUsed.map((lang) => (
                    <div key={lang.language} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: LANGUAGE_COLORS[lang.language.toLowerCase()] ?? "#6366f1" }}
                      />
                      <span className="text-xs capitalize flex-1">{lang.language}</span>
                      <span className="text-xs text-muted-foreground">{lang.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. Todos os arquivos e secrets deste projeto serao removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteProject.mutate({ id: deleteId })}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
