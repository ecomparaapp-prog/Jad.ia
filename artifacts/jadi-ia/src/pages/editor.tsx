import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  useAiChat,
  useGeneratePrompt,
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
  Send,
  Cpu,
  Lock,
  GitBranch,
  Eye,
  Code,
  FileText,
  Wand2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Editor() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      queryKey: selectedFileId ? getGetProjectFileQueryKey(projectId, selectedFileId) : getGetProjectFileQueryKey(projectId, 0),
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
    }
  }, [currentFile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const updateFile = useUpdateProjectFile({
    mutation: {
      onSuccess: () => {
        if (selectedFileId) {
          queryClient.invalidateQueries({ queryKey: getGetProjectFileQueryKey(projectId, selectedFileId) });
        }
        setIsSaving(false);
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
        toast({ title: "Arquivo criado" });
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

  const aiChat = useAiChat({
    mutation: {
      onSuccess: (data) => {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      },
      onError: () => {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Erro ao processar sua mensagem. Verifique se a chave GROQ_API_KEY está configurada." },
        ]);
      },
    },
  });

  const generatePrompt = useGeneratePrompt({
    mutation: {
      onSuccess: (data) => {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: `**Prompt Tecnico Gerado:**\n\n${data.prompt}\n\n**Sugestoes:**\n${data.suggestions.map((s) => `- ${s}`).join("\n")}` },
        ]);
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
    createFile.mutate({
      id: projectId,
      data: {
        name: newFileName,
        language: project?.language ?? "javascript",
      },
    });
  }

  function handleSendChat() {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput("");
    aiChat.mutate({
      data: {
        messages: [...chatMessages, msg],
        projectContext: `Projeto: ${project?.name}, Arquivo: ${currentFile?.name}`,
        language: project?.language,
      },
    });
  }

  function handleGeneratePrompt() {
    if (!project) return;
    generatePrompt.mutate({
      data: {
        description: project.description ?? project.name,
        projectType: "web app",
        language: project.language,
      },
    });
    setShowChat(true);
  }

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
          <p className="text-muted-foreground mb-4">Projeto nao encontrado</p>
          <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const lineCount = editingContent.split("\n").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
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
          <Badge variant="outline" className="text-xs capitalize flex-shrink-0">{project.language}</Badge>
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleGeneratePrompt} className="h-7 text-xs gap-1" data-testid="button-generate-prompt">
          <Wand2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Gerar Prompt</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowChat(!showChat)}
          className="h-7 text-xs gap-1"
          data-testid="button-toggle-chat"
        >
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">IA</span>
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!selectedFileId || isSaving} className="h-7 text-xs gap-1" data-testid="button-save">
          <Save className="h-3.5 w-3.5" />
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 border-r border-border bg-sidebar flex flex-col flex-shrink-0">
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
                  <Button size="icon" className="h-7 w-7 flex-shrink-0" onClick={handleCreateFile} data-testid="button-create-file">
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
                    {files?.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group transition-colors ${
                          selectedFileId === file.id
                            ? "bg-primary/15 text-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedFileId(file.id)}
                        data-testid={`file-item-${file.id}`}
                      >
                        <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs flex-1 truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-0 group-hover:opacity-100 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile.mutate({ id: projectId, fileId: file.id });
                          }}
                          data-testid={`button-delete-file-${file.id}`}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
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
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs font-medium mb-1">Repositorio Git</p>
                  <p className="text-xs text-muted-foreground">Integração com GitHub em breve.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>main</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Nenhum commit ainda</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {selectedFileId && currentFile ? (
              <div className="flex-1 flex overflow-hidden font-mono text-sm">
                <div className="w-10 flex-shrink-0 bg-muted/30 border-r border-border flex flex-col items-end pt-3 pr-2 text-muted-foreground/50 text-xs leading-6 overflow-hidden select-none">
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i + 1}>{i + 1}</div>
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
                      const newVal = editingContent.substring(0, start) + "  " + editingContent.substring(end);
                      setEditingContent(newVal);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Selecione um arquivo para editar</p>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l border-border bg-background flex flex-col overflow-hidden flex-shrink-0"
              >
                <div className="h-10 border-b border-border flex items-center px-3 justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Jadi IA</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowChat(false)}
                    data-testid="button-close-chat"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <Cpu className="h-10 w-10 mx-auto text-primary/30 mb-3" />
                      <p className="text-xs text-muted-foreground">
                        Olá! Sou a Jadi, sua assistente de desenvolvimento.
                        Pergunte sobre código, peça sugestões ou gere um projeto.
                      </p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`mb-3 ${msg.role === "user" ? "flex flex-row-reverse" : "flex"}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                        data-testid={`chat-message-${i}`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {aiChat.isPending && (
                    <div className="flex mb-3">
                      <div className="bg-muted rounded-lg px-3 py-2 text-xs">
                        <span className="animate-pulse">Jadi esta pensando...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </ScrollArea>

                <div className="border-t border-border p-2 flex gap-2 flex-shrink-0">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Pergunte algo..."
                    className="h-8 text-xs"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                    data-testid="input-chat"
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={handleSendChat}
                    disabled={aiChat.isPending || !chatInput.trim()}
                    data-testid="button-send-chat"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
