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
  javascript: "#F7DF1E",
  typescript: "#3178C6",
  python: "#3776AB",
  html: "#E34F26",
  css: "#1572B6",
  react: "#61DAFB",
  vue: "#42B883",
  "node.js": "#339933",
  "next.js": "#888888",
  "react native": "#61DAFB",
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
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">

      {/* Header */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card-md px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2.5"
              style={{ fontFamily: 'var(--app-font-serif)' }}
            >
              <div
                className="h-9 w-9 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--gradient-primary-glow)' }}
              >
                <LayoutDashboard className="h-4.5 w-4.5" strokeWidth={1.5} />
              </div>
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 ml-0.5">
              Bem-vindo, <span className="font-semibold text-foreground">{user?.name}</span>
            </p>
          </div>
          <button
            onClick={() => setLocation("/projetos/novo")}
            className="btn-primary px-6 py-2.5 text-sm"
            data-testid="button-new-project"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Novo Projeto
          </button>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loadingStats ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-[2rem]" />
            ))
          ) : (
            <>
              {[
                {
                  icon: Folder,
                  label: "Total de Projetos",
                  value: stats?.totalProjects ?? 0,
                  gradient: 'var(--gradient-primary)',
                  glow: 'var(--gradient-primary-glow)',
                  delay: 0.1,
                  testId: "stat-total-projects",
                },
                {
                  icon: Code2,
                  label: "Total de Arquivos",
                  value: stats?.totalFiles ?? 0,
                  gradient: 'var(--gradient-secondary)',
                  glow: 'var(--gradient-secondary-glow)',
                  delay: 0.2,
                  testId: "stat-total-files",
                },
                {
                  icon: Activity,
                  label: "Projetos Recentes",
                  value: stats?.recentProjectsCount ?? 0,
                  gradient: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
                  glow: '0 8px 32px rgba(66,165,245,0.30)',
                  delay: 0.3,
                  testId: "stat-recent-projects",
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stat.delay, ease: [0.16, 1, 0.3, 1] }}
                  data-testid={stat.testId}
                >
                  <div className="glass-card p-6 float-card">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-13 w-13 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
                        style={{ background: stat.gradient, boxShadow: stat.glow, height: '3.25rem', width: '3.25rem' }}
                      >
                        <stat.icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--app-font-mono)', fontSize: '0.7rem' }}>
                          {stat.label}
                        </p>
                        <p className="text-4xl font-bold" style={{ fontFamily: 'var(--app-font-serif)' }}>
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Projects list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--app-font-serif)' }}>Meus Projetos</h2>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--app-font-mono)' }}>
                {projects?.length ?? 0} projetos
              </span>
            </div>

            {loadingProjects ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-[1.5rem]" />
                ))}
              </div>
            ) : projects?.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-16 text-center"
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white"
                  style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--gradient-primary-glow)' }}
                >
                  <Folder className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <p className="text-muted-foreground text-sm mb-6">Nenhum projeto ainda</p>
                <button
                  onClick={() => setLocation("/projetos/novo")}
                  className="btn-primary px-6 py-2.5 text-sm"
                  data-testid="button-create-first-project"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Criar primeiro projeto
                </button>
              </motion.div>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {projects?.map((project, i) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div
                        className="glass-card-md p-4 cursor-pointer float-card group"
                        onClick={() => setLocation(`/projetos/${project.id}`)}
                        data-testid={`card-project-${project.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: `${LANGUAGE_COLORS[project.language.toLowerCase()] ?? '#00897B'}20`,
                                border: `1px solid ${LANGUAGE_COLORS[project.language.toLowerCase()] ?? '#00897B'}40`,
                              }}
                            >
                              <div
                                className="h-3.5 w-3.5 rounded-full"
                                style={{ backgroundColor: LANGUAGE_COLORS[project.language.toLowerCase()] ?? '#00897B' }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate" data-testid={`text-project-name-${project.id}`}>
                                {project.name}
                              </p>
                              {project.description && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span
                              className="text-[10px] capitalize hidden sm:block px-2.5 py-1 glass-inset rounded-full"
                              style={{ fontFamily: 'var(--app-font-mono)' }}
                            >
                              {project.language}
                            </span>
                            {project.isPublic ? (
                              <Globe className="h-3.5 w-3.5 text-muted-foreground mx-1" strokeWidth={1.5} />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground mx-1" strokeWidth={1.5} />
                            )}
                            <span className="text-xs text-muted-foreground hidden md:block">
                              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: ptBR })}
                            </span>
                            <button
                              className="btn-icon h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); setLocation(`/projetos/${project.id}`); }}
                              data-testid={`button-edit-project-${project.id}`}
                            >
                              <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                            <button
                              className="btn-icon h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); }}
                              data-testid={`button-delete-project-${project.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
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
            <h2 className="text-base font-semibold flex items-center gap-2 px-1" style={{ fontFamily: 'var(--app-font-serif)' }}>
              <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              Atividade Recente
            </h2>
            {loadingActivity ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-[1.25rem]" />
                ))}
              </div>
            ) : activity?.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">Nenhuma atividade ainda</p>
            ) : (
              <div className="space-y-2">
                {activity?.map((item) => (
                  <div
                    key={item.id}
                    className="glass-card-sm p-3.5"
                    data-testid={`activity-item-${item.id}`}
                  >
                    <p className="font-medium text-xs">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'var(--app-font-mono)' }}>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(stats?.languagesUsed?.length ?? 0) > 0 && (
              <div className="glass-card-sm p-4 mt-4">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ fontFamily: 'var(--app-font-mono)', color: '#00897B' }}
                >
                  Linguagens em uso
                </h3>
                <div className="space-y-2.5">
                  {stats?.languagesUsed.map((lang) => (
                    <div key={lang.language} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: LANGUAGE_COLORS[lang.language.toLowerCase()] ?? '#00897B' }}
                      />
                      <span className="text-xs capitalize flex-1" style={{ fontFamily: 'var(--app-font-mono)' }}>
                        {lang.language}
                      </span>
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--app-font-mono)' }}>
                        {lang.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="glass-card border-0" style={{ borderRadius: '2rem' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--app-font-serif)' }}>Deletar projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os arquivos e secrets deste projeto serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-glass border-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteProject.mutate({ id: deleteId })}
              className="btn-primary border-0"
              style={{ background: 'hsl(var(--destructive))', boxShadow: 'none' }}
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
