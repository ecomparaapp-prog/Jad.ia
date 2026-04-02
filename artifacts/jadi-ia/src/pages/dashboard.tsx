import { useState } from "react";
import { useLocation } from "wouter";
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
  Clock,
  LayoutDashboard,
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
  javascript: "#b87333",
  typescript: "#5a7a40",
  python: "#7a5c30",
  html: "#8c4a1a",
  css: "#4a6b3a",
  react: "#6b8c52",
  vue: "#58752e",
  "node.js": "#4a6b25",
  "next.js": "#583010",
  "react native": "#6b8c52",
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

      {/* Header */}
      <div className="border-b border-border/50" style={{ background: "hsl(var(--sidebar))" }}>
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 font-mono">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Bem-vindo, <span className="font-medium text-foreground">{user?.name}</span>
              </p>
            </div>
            <button
              onClick={() => setLocation("/projetos/novo")}
              className="neu-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground"
              data-testid="button-new-project"
            >
              <Plus className="h-4 w-4" />
              Novo Projeto
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loadingStats ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="neu-card p-5" data-testid="stat-total-projects">
                  <div className="flex items-center gap-4">
                    <div className="neu-card-sm h-12 w-12 flex items-center justify-center flex-shrink-0">
                      <Folder className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">Total de Projetos</p>
                      <p className="text-3xl font-bold mt-0.5">{stats?.totalProjects ?? 0}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="neu-card p-5" data-testid="stat-total-files">
                  <div className="flex items-center gap-4">
                    <div className="neu-card-sm h-12 w-12 flex items-center justify-center flex-shrink-0">
                      <Code2 className="h-5 w-5" style={{ color: "hsl(74 40% 40%)" }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">Total de Arquivos</p>
                      <p className="text-3xl font-bold mt-0.5">{stats?.totalFiles ?? 0}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="neu-card p-5" data-testid="stat-recent-projects">
                  <div className="flex items-center gap-4">
                    <div className="neu-card-sm h-12 w-12 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-5 w-5" style={{ color: "hsl(34 60% 40%)" }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">Projetos Recentes</p>
                      <p className="text-3xl font-bold mt-0.5">{stats?.recentProjectsCount ?? 0}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Projects list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold font-mono">Meus Projetos</h2>
              <span className="text-xs text-muted-foreground font-mono">{projects?.length ?? 0} projetos</span>
            </div>

            {loadingProjects ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : projects?.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="neu-inset p-14 text-center"
              >
                <Folder className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm mb-5">Nenhum projeto ainda</p>
                <button
                  onClick={() => setLocation("/projetos/novo")}
                  className="neu-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground"
                  data-testid="button-create-first-project"
                >
                  <Plus className="h-4 w-4" />
                  Criar primeiro projeto
                </button>
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
                      <div
                        className="neu-card p-4 cursor-pointer hover:translate-y-[-1px] transition-transform duration-150 group"
                        onClick={() => setLocation(`/projetos/${project.id}`)}
                        data-testid={`card-project-${project.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="neu-card-sm h-10 w-10 flex items-center justify-center flex-shrink-0"
                            >
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: LANGUAGE_COLORS[project.language.toLowerCase()] ?? "hsl(27 73% 30%)" }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate" data-testid={`text-project-name-${project.id}`}>
                                {project.name}
                              </p>
                              {project.description && (
                                <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <span className="text-[10px] font-mono text-muted-foreground capitalize hidden sm:block px-2 py-0.5 neu-inset rounded-full">
                              {project.language}
                            </span>
                            {project.isPublic ? (
                              <Globe className="h-3.5 w-3.5 text-muted-foreground mx-1" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground mx-1" />
                            )}
                            <span className="text-xs text-muted-foreground hidden md:block">
                              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: ptBR })}
                            </span>
                            <button
                              className="neu-btn h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-card"
                              onClick={(e) => { e.stopPropagation(); setLocation(`/projetos/${project.id}`); }}
                              data-testid={`button-edit-project-${project.id}`}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="neu-btn h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-card text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); }}
                              data-testid={`button-delete-project-${project.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Activity */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold font-mono flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Atividade Recente
            </h2>
            {loadingActivity ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : activity?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
            ) : (
              <div className="space-y-2">
                {activity?.map((item) => (
                  <div
                    key={item.id}
                    className="neu-card-sm p-3 text-sm"
                    data-testid={`activity-item-${item.id}`}
                  >
                    <p className="font-medium text-xs">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(stats?.languagesUsed?.length ?? 0) > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wide mb-3">Linguagens em uso</h3>
                <div className="space-y-2">
                  {stats?.languagesUsed.map((lang) => (
                    <div key={lang.language} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: LANGUAGE_COLORS[lang.language.toLowerCase()] ?? "hsl(27 73% 30%)" }}
                      />
                      <span className="text-xs capitalize flex-1 font-mono">{lang.language}</span>
                      <span className="text-xs text-muted-foreground font-mono">{lang.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="neu-card border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os arquivos e secrets deste projeto serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="neu-btn bg-card">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteProject.mutate({ id: deleteId })}
              className="neu-btn bg-destructive text-destructive-foreground"
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
