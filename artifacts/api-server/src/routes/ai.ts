import { Router, type IRouter } from "express";
import { AiChatBody, GeneratePromptBody, AnalyzeStackBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

async function callGroq(
  messages: { role: string; content: string | unknown[] }[],
  model = "llama-3.3-70b-versatile",
  stream = false,
): Promise<Response> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY não configurada");

  return fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: stream ? 8192 : 4096,
      stream,
    }),
  });
}

async function callGemini(
  messages: { role: string; content: string | unknown[] }[],
  model = "gemini-1.5-flash",
  stream = false,
): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  return fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: stream ? 8192 : 4096,
      stream,
    }),
  });
}

async function callGroqText(messages: { role: string; content: string }[], model = "llama-3.3-70b-versatile"): Promise<string> {
  const res = await callGroq(messages, model, false);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${err}`);
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

async function callGeminiText(messages: { role: string; content: string }[], model = "gemini-1.5-flash"): Promise<string> {
  const res = await callGemini(messages, model, false);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

async function dispatchTask(
  taskType: "analise" | "construcao",
  messages: { role: string; content: string }[],
): Promise<{ text: string; provider: string }> {
  if (taskType === "analise") {
    const text = await callGeminiText(messages, "gemini-1.5-flash");
    return { text, provider: "gemini" };
  }

  try {
    const text = await callGroqText(messages, "llama-3.3-70b-versatile");
    return { text, provider: "groq" };
  } catch (err: unknown) {
    const errMsg = (err as Error).message ?? "";
    const isRateLimit = errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit") || errMsg.toLowerCase().includes("too many");
    if (isRateLimit) {
      logger.warn("Alternando provedor por estabilidade...");
      try {
        const text = await callGeminiText(messages, "gemini-1.5-flash");
        return { text, provider: "gemini-fallback" };
      } catch {
        throw new Error("Todos os provedores falharam. Tente novamente em breve.");
      }
    }
    throw err;
  }
}

function extractCodeBlocks(text: string): string[] {
  const regex = /```(?:\w+)?\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

router.post("/ai/chat", requireAuth, async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { messages, projectContext, language, systemPrompt } = parsed.data;

  const baseSystemContent = `Você é Jadi, uma assistente de desenvolvimento de software inteligente integrada na plataforma Jadi.ia.
Você ajuda desenvolvedores brasileiros a criar sites, sistemas, web apps e aplicativos mobile.
Responda sempre em português do Brasil.
${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
${language && language !== "auto" ? `Linguagem principal do projeto: ${language}` : ""}
Quando fornecer código, sempre use blocos de código com a linguagem especificada (ex: \`\`\`javascript).
Seja concisa, direta e técnica. Explique apenas o necessário.`;

  const systemContent = systemPrompt ? `${baseSystemContent}\n\n${systemPrompt}` : baseSystemContent;
  const systemMessage = { role: "system", content: systemContent };

  try {
    const groqMessages = [systemMessage, ...messages] as { role: string; content: string }[];
    const responseText = await callGroqText(groqMessages);
    const codeBlocks = extractCodeBlocks(responseText);
    res.json({ message: responseText, codeBlocks });
  } catch (error) {
    logger.error({ error }, "Erro ao chamar Groq API");
    res.status(500).json({ error: "Erro ao processar solicitação de IA. Verifique se a chave GROQ_API_KEY está configurada." });
  }
});

router.post("/ai/generate-prompt", requireAuth, async (req, res): Promise<void> => {
  const parsed = GeneratePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { description, projectType, language } = parsed.data;

  const systemMessage = {
    role: "system",
    content: `Você é um agente técnico especializado em gerar prompts otimizados para desenvolvimento de software.
Seu objetivo é transformar descrições simples em prompts técnicos detalhados para guiar a criação de sistemas.
Responda sempre em português do Brasil.
Formate a resposta como JSON com campos "prompt" (string) e "suggestions" (array de strings com sugestões adicionais).`,
  };

  const userMessage = {
    role: "user",
    content: `Gere um prompt técnico detalhado para o seguinte projeto:
Descrição: ${description}
Tipo de projeto: ${projectType}
${language ? `Linguagem/Framework: ${language}` : ""}

O prompt deve incluir:
1. Arquitetura técnica recomendada
2. Principais funcionalidades a implementar
3. Tecnologias e bibliotecas sugeridas
4. Estrutura de pastas
5. Considerações de segurança e performance

Responda em formato JSON: { "prompt": "...", "suggestions": ["...", "..."] }`,
  };

  try {
    const responseText = await callGroqText([systemMessage, userMessage]);

    let promptData: { prompt: string; suggestions: string[] };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        promptData = JSON.parse(jsonMatch[0]);
      } else {
        promptData = { prompt: responseText, suggestions: [] };
      }
    } catch {
      promptData = { prompt: responseText, suggestions: [] };
    }

    res.json(promptData);
  } catch (error) {
    logger.error({ error }, "Erro ao gerar prompt");
    res.status(500).json({ error: "Erro ao gerar prompt. Verifique se a chave GROQ_API_KEY está configurada." });
  }
});

router.post("/ai/analyze-stack", requireAuth, async (req, res): Promise<void> => {
  const parsed = AnalyzeStackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { projectName, description, projectType } = parsed.data;

  const systemMessage = {
    role: "system",
    content: `Você é o SISTEMA ANALISTA do Jadi.ia, especializado em arquitetura de software e seleção de tecnologias.
Sua missão é analisar a descrição de um projeto e recomendar a stack tecnológica ideal.
Utilize raciocínio técnico preciso. Responda SEMPRE em formato JSON válido, sem texto extra antes ou depois.
Use linguagem técnica clara e objetiva. Responda em português do Brasil.`,
  };

  const userMessage = {
    role: "user",
    content: `Analise o projeto abaixo e recomende a melhor stack tecnológica:

Nome do projeto: ${projectName}
Descrição: ${description}
${projectType ? `Tipo de projeto (sugestão do usuário): ${projectType}` : ""}

Responda com um JSON no seguinte formato:
{
  "language": "linguagem principal (ex: TypeScript, Python, JavaScript)",
  "framework": "framework principal (ex: React, Django, Next.js, React Native)",
  "projectType": "tipo de projeto identificado (ex: E-commerce, App Mobile, API REST, Dashboard, Landing Page)",
  "justification": "Justificativa técnica de 1-2 frases explicando por que essa stack é ideal para este projeto",
  "systemPrompt": "Instrução técnica completa para guiar a IA na geração de código. Deve especificar linguagem, framework, padrões de código, estrutura de pastas e boas práticas. Seja detalhado e técnico."
}`,
  };

  try {
    const { text: responseText } = await dispatchTask("analise", [systemMessage, userMessage]);

    let stackData: {
      language: string;
      framework: string;
      projectType: string;
      justification: string;
      systemPrompt: string;
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        stackData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Resposta sem JSON válido");
      }
    } catch {
      stackData = {
        language: "TypeScript",
        framework: "React",
        projectType: "Aplicação Web",
        justification: "Stack moderna e versátil ideal para desenvolvimento web.",
        systemPrompt: "Você é um especialista em desenvolvimento web com TypeScript e React. Gere código moderno, tipado e seguindo boas práticas.",
      };
    }

    res.json(stackData);
  } catch (error) {
    logger.error({ error }, "Erro ao analisar stack");
    res.status(500).json({ error: "Erro ao analisar stack." });
  }
});

router.post("/ai/stream", requireAuth, async (req, res): Promise<void> => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const { messages, projectContext, language, systemPrompt, taskType } = req.body as {
    messages: Array<{ role: string; content: string | unknown[] }>;
    projectContext?: string;
    language?: string;
    systemPrompt?: string;
    taskType?: "analise" | "construcao";
  };

  if (!messages || !Array.isArray(messages)) {
    sendEvent("error", { message: "messages é obrigatório" });
    res.end();
    return;
  }

  const hasImages = messages.some(
    (m) => Array.isArray(m.content) && m.content.some((c: unknown) => (c as { type?: string }).type === "image_url"),
  );

  const isAnalyst = taskType === "analise";

  const baseSystem = isAnalyst
    ? `Você é o SISTEMA ANALISTA do Jadi.ia. Especialista em arquitetura de software, análise de requisitos e planejamento técnico.
Analise projetos com profundidade técnica, gere diagnósticos precisos e planos estruturados.
Use linguagem técnica objetiva. Formate respostas em listas técnicas claras.
Responda sempre em português do Brasil.
${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
${language && language !== "auto" ? `Linguagem principal: ${language}` : ""}`
    : `Você é o SISTEMA CONSTRUTOR do Jadi.ia. Executor especializado em geração de código limpo, funcional e bem estruturado.
Você transforma planos em código real. Priorize código funcional e completo acima de tudo.
Use fontes monoespaçadas para código. Sempre use blocos de código com linguagem especificada (ex: \`\`\`javascript).
Responda sempre em português do Brasil.
${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
${language && language !== "auto" ? `Linguagem principal do projeto: ${language}` : ""}`;

  const systemContent = systemPrompt ? `${baseSystem}\n\n${systemPrompt}` : baseSystem;
  const groqMessages = [{ role: "system", content: systemContent }, ...messages];

  const groqModel = hasImages ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";
  const geminiModel = "gemini-1.5-flash";

  const attemptStream = async (provider: "groq" | "gemini"): Promise<Response> => {
    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");
      return callGemini(groqMessages, geminiModel, true);
    }
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY não configurada");
    return callGroq(groqMessages, groqModel, true);
  };

  const streamResponse = async (apiResponse: Response) => {
    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw Object.assign(new Error(`API error: ${errText}`), { status: apiResponse.status });
    }

    const reader = apiResponse.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") {
          sendEvent("done", {});
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) sendEvent("token", { token });
        } catch {
          // skip malformed chunk
        }
      }
    }

    sendEvent("done", {});
    res.end();
  };

  try {
    const primaryProvider: "groq" | "gemini" = isAnalyst ? "gemini" : "groq";
    let apiResponse: Response;

    try {
      apiResponse = await attemptStream(primaryProvider);
      if (!apiResponse.ok && (apiResponse.status === 429 || apiResponse.status >= 500) && !isAnalyst) {
        logger.warn("Alternando provedor por estabilidade...");
        sendEvent("provider_switch", { message: "Alternando provedor por estabilidade..." });
        apiResponse = await attemptStream("gemini");
      }
    } catch (err: unknown) {
      const errMsg = (err as Error).message ?? "";
      const isRateLimit = errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit");
      if (isRateLimit && !isAnalyst) {
        logger.warn("Alternando provedor por estabilidade...");
        sendEvent("provider_switch", { message: "Alternando provedor por estabilidade..." });
        apiResponse = await attemptStream("gemini");
      } else {
        throw err;
      }
    }

    await streamResponse(apiResponse);
  } catch (error) {
    logger.error({ error }, "Erro no streaming SSE");
    sendEvent("error", { message: "Erro ao processar streaming" });
    res.end();
  }
});

export default router;
