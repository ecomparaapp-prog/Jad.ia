import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import {
  useGetProject,
  useListProjectFiles,
  useGetProjectFile,
  useCreateProjectFile,
  useUpdateProjectFile,
  useDeleteProjectFile,
  useListProjectSecrets,
  useCreateProjectSecret,
  useDeleteProjectSecret,
  useAnalyzeStack,
  getGetProjectQueryKey,
  getListProjectFilesQueryKey,
  getGetProjectFileQueryKey,
  getListProjectSecretsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Cpu,
  Lock,
  GitBranch,
  Code,
  FileText,
  Wand2,
  X,
  Bot,
  Eye,
  EyeOff,
  Layers,
  ImageIcon,
  Smartphone,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import VibeChatPanel from "@/components/VibeChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import GeneratePromptModal from "@/components/GeneratePromptModal";
import ImagePickerModal from "@/components/ImagePickerModal";
import GitHubPanel from "@/components/GitHubPanel";
import MobilePanel from "@/components/MobilePanel";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isDecision?: boolean;
  isStreaming?: boolean;
}

interface StackDecision {
  language: string;
  framework: string;
  projectType: string;
  justification: string;
  systemPrompt: string;
}

function detectLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "html",
    htm: "html",
    css: "css",
    js: "javascript",
    ts: "typescript",
    jsx: "javascript",
    tsx: "typescript",
    py: "python",
    json: "json",
    md: "markdown",
    sql: "sql",
    sh: "bash",
  };
  return map[ext] ?? "javascript";
}

export default function Editor() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");
  const [stackDecision, setStackDecision] = useState<StackDecision | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [vibeMode, setVibeMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [pendingPrefill, setPendingPrefill] = useState<string>("");
  const [deleteFileId, setDeleteFileId] = useState<number | null>(null);

  const liveUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFileContentsRef = useRef<Record<string, string>>({});

  const { data: project, isLoading: loadingProject } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  const { data: files, isLoading: loadingFiles } = useListProjectFiles(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectFilesQueryKey(projectId) },
  });

  const { data: secrets, isLoading: loadingSecrets } = useListProjectSecrets(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectSecretsQueryKey(projectId) },
  });

  const { data: currentFile } = useGetProjectFile(projectId, selectedFileId ?? 0, {
    query: {
      enabled: !!projectId && !!selectedFileId,
      queryKey: selectedFileId
        ? getGetProjectFileQueryKey(projectId, selectedFileId)
        : getGetProjectFileQueryKey(projectId, 0),
    },
  });

  useEffect(() => {
    if (files && files.length > 0 && !selectedFileId) {
      setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  useEffect(() => {
    if (currentFile) {
      setEditingContent(currentFile.content);
      setSelectedLine(null);
    }
  }, [currentFile]);

  const isAutoMode = project?.language === "auto";

  const analyzeStack = useAnalyzeStack({
    mutation: {
      onSuccess: (data) => {
        const decision: StackDecision = {
          language: data.language,
          framework: data.framework,
          projectType: data.projectType,
          justification: data.justification,
          systemPrompt: data.systemPrompt,
        };
        setStackDecision(decision);
        setHasAnalyzed(true);
        const msg: ChatMessage = {
          role: "assistant",
          content: `🤖 **Agente Analista**\n\nIdentifiquei que seu projeto é **${data.projectType}**. Vou utilizar **${data.framework} (${data.language})** por ser a melhor opção: ${data.justification}\n\nDescreva o que quer construir — o código vai aparecer no editor em tempo real!`,
          isDecision: true,
        };
        setChatMessages([msg]);
      },
      onError: () => {
        setHasAnalyzed(true);
        setChatMessages([
          {
            role: "assistant",
            content:
              "Não consegui analisar a stack automaticamente. Descreva o que quer construir e eu escolho a melhor linguagem.",
          },
        ]);
      },
    },
  });

  useEffect(() => {
    if (showChat && isAutoMode && !hasAnalyzed && project && !analyzeStack.isPending) {
      analyzeStack.mutate({
        data: {
          projectName: project.name,
          description: project.description ?? project.name,
        },
      });
    }
  }, [showChat, isAutoMode, hasAnalyzed, project]);

  useEffect(() => {
    if (!stackDecision || !projectId || !token) return;
    fetch(`/api/projects/${projectId}/context`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        language: stackDecision.language,
        framework: stackDecision.framework,
        projectType: stackDecision.projectType,
        systemPrompt: stackDecision.systemPrompt,
        savedAt: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, [stackDecision]);

  function handleLineClick(lineNumber: number) {
    setSelectedLine(lineNumber);
    const lines = editingContent.split("\n");
    const lineContent = lines[lineNumber - 1] ?? "";
    const trimmed = lineContent.trim();
    if (!trimmed) return;
    const prefill = `[Linha ${lineNumber}]: \`${trimmed}\`\n\nEdite apenas esta linha: `;
    setPendingPrefill(prefill);
    if (!showChat) setShowChat(true);
  }

  const updateFile = useUpdateProjectFile({
    mutation: {
      onSuccess: () => {
        if (selectedFileId) {
          queryClient.invalidateQueries({ queryKey: getGetProjectFileQueryKey(projectId, selectedFileId) });
        }
        setIsSaving(false);
        setPreviewRevision((r) => r + 1);
        toast({ title: "Arquivo salvo" });
      },
      onError: () => {
        setIsSaving(false);
        toast({ title: "Erro ao salvar", variant: "destructive" });
      },
    },
  });

  const createFile = useCreateProjectFile({
    mutation: {
      onSuccess: (file) => {
        queryClient.invalidateQueries({ queryKey: getListProjectFilesQueryKey(projectId) });
        setSelectedFileId(file.id);
        setNewFileName("");
        setShowNewFile(false);

        const pendingContent = pendingFileContentsRef.current[file.name];
        if (pendingContent !== undefined) {
          delete pendingFileContentsRef.current[file.name];
          setEditingContent(pendingContent);
          updateFile.mutate({
            id: projectId,
            fileId: file.id,
            data: { content: pendingContent },
          });
        } else {
          toast({ title: "Arquivo criado" });
        }
      },
    },
  });

  const deleteFile = useDeleteProjectFile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectFilesQueryKey(projectId) });
        setSelectedFileId(null);
        toast({ title: "Arquivo deletado" });
      },
    },
  });

  const createSecret = useCreateProjectSecret({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectSecretsQueryKey(projectId) });
        setNewSecretKey("");
        setNewSecretValue("");
        toast({ title: "Secret adicionado" });
      },
    },
  });

  const deleteSecret = useDeleteProjectSecret({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectSecretsQueryKey(projectId) });
        toast({ title: "Secret removido" });
      },
    },
  });

  function handleSave() {
    if (!selectedFileId) return;
    setIsSaving(true);
    updateFile.mutate({
      id: projectId,
      fileId: selectedFileId,
      data: { content: editingContent },
    });
  }

  function handleCreateFile() {
    if (!newFileName.trim()) return;
    const effectiveLanguage = detectLanguageFromFilename(newFileName);
    createFile.mutate({
      id: projectId,
      data: { name: newFileName, language: effectiveLanguage },
    });
  }

  function handleGeneratePrompt() {
    setShowPromptModal(true);
  }

  function handleUsePromptInChat(prompt: string) {
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: prompt },
    ]);
    setShowChat(true);
    setShowPromptModal(false);
  }

  function handleReanalyze() {
    setStackDecision(null);
    setHasAnalyzed(false);
    setChatMessages([]);
  }

  function handleLiveCodeUpdate(code: string, _lang: string) {
    if (!code.trim()) return;
    setEditingContent(code);
    if (liveUpdateTimerRef.current) clearTimeout(liveUpdateTimerRef.current);
    liveUpdateTimerRef.current = setTimeout(() => {
      if (selectedFileId) {
        updateFile.mutate({
          id: projectId,
          fileId: selectedFileId,
          data: { content: code },
        });
      }
    }, 1500);
  }

  const handleFileWrite = useCallback(
    (filename: string, content: string) => {
      const existingFile = files?.find((f) => f.name === filename);

      if (existingFile) {
        setSelectedFileId(existingFile.id);
        setEditingContent(content);
        if (liveUpdateTimerRef.current) clearTimeout(liveUpdateTimerRef.current);
        updateFile.mutate({
          id: projectId,
          fileId: existingFile.id,
          data: { content },
        });
      } else {
        pendingFileContentsRef.current[filename] = content;
        const lang = detectLanguageFromFilename(filename);
        createFile.mutate({
          id: projectId,
          data: { name: filename, language: lang },
        });
      }

      setPreviewRevision((r) => r + 1);
      if (!showPreview) setShowPreview(true);
    },
    [files, projectId, showPreview],
  );

  function toggleVibeMode() {
    const next = !vibeMode;
    setVibeMode(next);
    if (next) {
      setShowChat(true);
      setShowPreview(true);
    }
  }

  const effectiveLangLabel = isAutoMode
    ? stackDecision?.framework ?? "Automático"
    : project?.language ?? "";

  if (loadingProject) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-border bg-background flex items-center px-4 gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex-1 flex">
          <Skeleton className="w-48 border-r border-border" />
          <Skeleton className="flex-1" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Projeto não encontrado</p>
          <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const lineCount = editingContent.split("\n").length;

  return (
    <>
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="h-12 border-b border-border bg-background flex items-center px-3 gap-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back-editor"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate">{project.name}</span>
          <Badge variant="outline" className="text-xs capitalize flex-shrink-0 flex items-center gap-1">
            {isAutoMode && <Bot className="h-3 w-3 text-primary" />}
            {effectiveLangLabel}
          </Badge>
        </div>
        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleGeneratePrompt}
          className="h-7 text-xs gap-1 hidden sm:flex"
          data-testid="button-generate-prompt"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Gerar Prompt
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowImagePicker(true)}
          className="h-7 text-xs gap-1 hidden sm:flex"
          title="Buscar imagens do Pixabay e Unsplash"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Imagens
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className={`h-7 text-xs gap-1 hidden sm:flex ${showPreview ? "text-teal-400" : ""}`}
          title="Mostrar/ocultar preview"
        >
          {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          Preview
        </Button>

        <Button
          size="sm"
          onClick={toggleVibeMode}
          data-testid="button-toggle-vibe"
          className={`relative h-8 text-xs gap-1.5 px-3 transition-all duration-200 ${
            vibeMode
              ? "bg-teal-600 text-white shadow-[0_0_18px_rgba(0,150,136,0.5)]"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Vibe</span>
          {vibeMode && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-teal-400 border border-background animate-pulse" />
          )}
        </Button>

        <Button
          size="sm"
          onClick={() => setShowChat(!showChat)}
          data-testid="button-toggle-chat"
          className={`relative h-8 text-xs gap-1.5 px-3 transition-all duration-200 ${
            showChat && !vibeMode
              ? "bg-primary text-primary-foreground shadow-[0_0_18px_rgba(139,92,246,0.45)]"
              : showChat && vibeMode
                ? "bg-primary/60 text-primary-foreground"
                : "bg-primary/90 text-primary-foreground hover:bg-primary hover:shadow-[0_0_14px_rgba(139,92,246,0.35)]"
          }`}
        >
          {!showChat && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-400 border border-background animate-pulse" />
          )}
          <Cpu className="h-3.5 w-3.5" />
          <span>IA</span>
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={!selectedFileId || isSaving}
          className="h-7 text-xs gap-1"
          data-testid="button-save"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <PanelGroup direction="horizontal" autoSaveId="jadi-editor-layout" className="flex-1 min-h-0 overflow-hidden">
        {/* ── 1. ARQUIVOS — far left ── */}
        <Panel id="sidebar" order={1} defaultSize={13} minSize={8} maxSize={22} className="flex flex-col bg-sidebar border-r border-border overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="h-9 rounded-none border-b border-border bg-transparent flex-shrink-0">
              <TabsTrigger value="code" className="text-xs flex-1 rounded-none" data-testid="tab-code">
                <Code className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="secrets" className="text-xs flex-1 rounded-none" data-testid="tab-secrets">
                <Lock className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="git" className="text-xs flex-1 rounded-none" data-testid="tab-git">
                <GitBranch className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="mobile" className="text-xs flex-1 rounded-none" data-testid="tab-mobile">
                <Smartphone className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Arquivos</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setShowNewFile(!showNewFile)}
                  data-testid="button-add-file"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {showNewFile && (
                <div className="px-2 pb-2 flex gap-1">
                  <Input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="nome.js"
                    className="h-7 text-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
                    data-testid="input-new-file-name"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={handleCreateFile}
                    data-testid="button-create-file"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <ScrollArea className="flex-1">
                {loadingFiles ? (
                  <div className="space-y-1 p-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-7 rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="p-1 space-y-0.5">
                    {files?.filter((f) => f.name !== ".jadia_context").map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group transition-colors ${
                          selectedFileId === file.id
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted/60"
                        }`}
                        onClick={() => setSelectedFileId(file.id)}
                        data-testid={`file-item-${file.id}`}
                      >
                        <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs flex-1 truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-5 w-5 flex-shrink-0 transition-opacity ${
                            selectedFileId === file.id
                              ? "opacity-70 hover:opacity-100 hover:bg-white/20"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteFileId(file.id);
                          }}
                          data-testid={`button-delete-file-${file.id}`}
                        >
                          <Trash2 className={`h-3 w-3 ${selectedFileId === file.id ? "text-primary-foreground" : "text-destructive"}`} />
                        </Button>
                      </div>
                    ))}
                    {files?.length === 0 && (
                      <p className="text-xs text-muted-foreground px-2 py-3">Nenhum arquivo</p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="secrets" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              <div className="px-3 py-2 flex-shrink-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Secrets</p>
              </div>
              <div className="px-2 pb-2 space-y-1 flex-shrink-0">
                <Input
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  placeholder="CHAVE"
                  className="h-7 text-xs font-mono"
                  data-testid="input-secret-key"
                />
                <Input
                  value={newSecretValue}
                  onChange={(e) => setNewSecretValue(e.target.value)}
                  placeholder="valor"
                  type="password"
                  className="h-7 text-xs"
                  data-testid="input-secret-value"
                />
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => {
                    if (newSecretKey && newSecretValue) {
                      createSecret.mutate({ id: projectId, data: { key: newSecretKey, value: newSecretValue } });
                    }
                  }}
                  data-testid="button-add-secret"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>
              <Separator />
              <ScrollArea className="flex-1">
                {loadingSecrets ? (
                  <div className="space-y-1 p-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-7 rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="p-1 space-y-0.5">
                    {secrets?.map((secret) => (
                      <div
                        key={secret.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded group hover:bg-muted/50"
                        data-testid={`secret-item-${secret.id}`}
                      >
                        <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs flex-1 truncate font-mono">{secret.key}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-0 group-hover:opacity-100 flex-shrink-0"
                          onClick={() => deleteSecret.mutate({ id: projectId, secretId: secret.id })}
                          data-testid={`button-delete-secret-${secret.id}`}
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {secrets?.length === 0 && (
                      <p className="text-xs text-muted-foreground px-2 py-3">Nenhum secret</p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="git" className="flex-1 overflow-auto m-0 p-3">
              {project && (
                <GitHubPanel
                  projectId={projectId}
                  projectName={project.name}
                />
              )}
            </TabsContent>

            <TabsContent value="mobile" className="flex-1 overflow-auto m-0">
              <MobilePanel projectId={projectId} />
            </TabsContent>
          </Tabs>
        </Panel>

        <PanelResizeHandle className="w-[4px] bg-border/60 hover:bg-primary/60 data-[resize-handle-active=pointer]:bg-primary transition-colors cursor-col-resize flex-shrink-0" />

        {/* ── 2. ANÁLISE + PREVIEW + VIBE — juntos, na ordem certa ── */}
        {showChat && (
          <Panel id="chat-area" order={2} defaultSize={52} minSize={20}>
            <AnimatePresence>
              <VibeChatPanel
                projectName={project.name}
                currentFileName={currentFile?.name}
                language={project.language}
                stackDecision={stackDecision}
                hasAnalyzed={hasAnalyzed}
                isAnalyzing={analyzeStack.isPending}
                initialMessages={chatMessages}
                onMessagesChange={setChatMessages}
                onLiveCodeUpdate={handleLiveCodeUpdate}
                onClose={() => setShowChat(false)}
                onReanalyze={handleReanalyze}
                vibeMode={vibeMode}
                onFileWrite={handleFileWrite}
                prefillInput={pendingPrefill}
                onPrefillConsumed={() => setPendingPrefill("")}
                centerContent={
                  showPreview ? (
                    <PreviewPanel
                      projectId={projectId}
                      token={token}
                      revisionId={previewRevision}
                      currentFileName={currentFile?.name}
                      projectLanguage={stackDecision?.language ?? project.language}
                    />
                  ) : undefined
                }
              />
            </AnimatePresence>
          </Panel>
        )}
        {showChat && <PanelResizeHandle className="w-[4px] bg-border/60 hover:bg-primary/60 data-[resize-handle-active=pointer]:bg-primary transition-colors cursor-col-resize flex-shrink-0" />}

        {/* Preview standalone quando o chat está fechado */}
        {!showChat && showPreview && (
          <Panel id="preview-standalone" order={3} defaultSize={30} minSize={15}>
            <div className="h-full border-r border-border overflow-hidden">
              <PreviewPanel
                projectId={projectId}
                token={token}
                revisionId={previewRevision}
                currentFileName={currentFile?.name}
                projectLanguage={stackDecision?.language ?? project.language}
              />
            </div>
          </Panel>
        )}
        {!showChat && showPreview && <PanelResizeHandle className="w-[4px] bg-border/60 hover:bg-primary/60 data-[resize-handle-active=pointer]:bg-primary transition-colors cursor-col-resize flex-shrink-0" />}

        {/* ── 4. EDITOR DE CÓDIGO — extremidade direita ── */}
        <Panel id="code-editor" order={4} minSize={15} className="flex overflow-hidden font-mono text-sm">
          {selectedFileId && currentFile ? (
            <>
              <div className="w-10 flex-shrink-0 bg-muted/30 border-r border-border flex flex-col items-end pt-3 pr-2 text-muted-foreground/50 text-xs leading-6 overflow-hidden select-none">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div
                    key={i + 1}
                    title={`Clique para editar linha ${i + 1} com IA`}
                    className={`cursor-pointer w-full text-right pr-0 transition-colors hover:text-primary hover:bg-primary/10 rounded-sm px-1 ${selectedLine === i + 1 ? "text-primary bg-primary/15" : ""}`}
                    onClick={() => handleLineClick(i + 1)}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="flex-1 p-3 bg-background resize-none outline-none leading-6 text-sm font-mono overflow-auto"
                spellCheck={false}
                data-testid="editor-textarea"
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                    e.preventDefault();
                    handleSave();
                  }
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    setEditingContent(
                      editingContent.substring(0, start) + "  " + editingContent.substring(end),
                    );
                  }
                }}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Selecione um arquivo para editar</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {vibeMode
                    ? "Ative o Vibe Coding e descreva o que quer criar"
                    : "Ou abre o chat da IA para gerar código"}
                </p>
              </div>
            </div>
          )}
        </Panel>
      </PanelGroup>
    </div>

    {showPromptModal && project && (
      <GeneratePromptModal
        projectName={project.name}
        projectDescription={project.description ?? project.name}
        projectType={stackDecision?.projectType}
        language={stackDecision?.language ?? (isAutoMode ? undefined : project.language)}
        onClose={() => setShowPromptModal(false)}
        onUsePrompt={handleUsePromptInChat}
      />
    )}

    <ImagePickerModal
      open={showImagePicker}
      onClose={() => setShowImagePicker(false)}
      token={token}
      onInsert={(url, description) => {
        const currentLang = selectedFileId
          ? (files?.find((f) => f.id === selectedFileId)?.language ?? "html")
          : "html";
        const isHtmlLike = ["html", "css", "jsx", "tsx"].includes(currentLang);
        const toInsert = isHtmlLike
          ? `<img src="${url}" alt="${description}" />`
          : url;
        setEditingContent((prev) => prev + "\n" + toInsert);
        toast({ title: "Imagem inserida!", description: "URL adicionada ao final do arquivo." });
      }}
    />

    <AlertDialog open={deleteFileId !== null} onOpenChange={(open) => !open && setDeleteFileId(null)}>
      <AlertDialogContent className="glass-card border-0" style={{ borderRadius: '2rem' }}>
        <AlertDialogHeader>
          <AlertDialogTitle style={{ fontFamily: 'var(--app-font-serif)' }}>Excluir arquivo?</AlertDialogTitle>
          <AlertDialogDescription>
            O arquivo <strong>{files?.find((f) => f.id === deleteFileId)?.name}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="btn-glass border-0">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (deleteFileId) {
                if (selectedFileId === deleteFileId) setSelectedFileId(null);
                deleteFile.mutate({ id: projectId, fileId: deleteFileId });
                setDeleteFileId(null);
              }
            }}
            className="btn-primary border-0"
            style={{ background: 'hsl(var(--destructive))', boxShadow: 'none' }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
