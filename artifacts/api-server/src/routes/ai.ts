import { Router, type IRouter } from "express";
import { AiChatBody, GeneratePromptBody, AnalyzeStackBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(messages: { role: string; content: string }[], model = "llama-3.3-70b-versatile"): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY não configurada");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
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

  const systemContent = systemPrompt
    ? `${baseSystemContent}\n\n${systemPrompt}`
    : baseSystemContent;

  const systemMessage = {
    role: "system",
    content: systemContent,
  };

  try {
    const groqMessages = [systemMessage, ...messages];
    const responseText = await callGroq(groqMessages);
    const codeBlocks = extractCodeBlocks(responseText);

    res.json({
      message: responseText,
      codeBlocks,
    });
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
    const responseText = await callGroq([systemMessage, userMessage]);

    let promptData: { prompt: string; suggestions: string[] };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        promptData = JSON.parse(jsonMatch[0]);
      } else {
        promptData = {
          prompt: responseText,
          suggestions: [],
        };
      }
    } catch {
      promptData = {
        prompt: responseText,
        suggestions: [],
      };
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
    content: `Você é o Agente Analista do Jadi.ia, especializado em arquitetura de software e seleção de tecnologias.
Sua missão é analisar a descrição de um projeto e recomendar a stack tecnológica ideal.
Responda SEMPRE em formato JSON válido, sem texto extra antes ou depois.
Responda em português do Brasil.`,
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
  "justification": "Breve justificativa técnica de 1-2 frases explicando por que essa stack é ideal para este projeto",
  "systemPrompt": "Instrução técnica completa para guiar a IA na geração de código. Deve especificar linguagem, framework, padrões de código, estrutura de pastas e boas práticas. Seja detalhado e técnico."
}`,
  };

  try {
    const responseText = await callGroq([systemMessage, userMessage], "llama-3.3-70b-versatile");

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
    res.status(500).json({ error: "Erro ao analisar stack. Verifique se a chave GROQ_API_KEY está configurada." });
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    sendEvent("error", { message: "GROQ_API_KEY não configurada" });
    res.end();
    return;
  }

  const { messages, projectContext, language, systemPrompt } = req.body as {
    messages: Array<{ role: string; content: string | unknown[] }>;
    projectContext?: string;
    language?: string;
    systemPrompt?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    sendEvent("error", { message: "messages é obrigatório" });
    res.end();
    return;
  }

  const hasImages = messages.some(
    (m) => Array.isArray(m.content) && m.content.some((c: unknown) => (c as { type?: string }).type === "image_url"),
  );

  const model = hasImages ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";

  const baseSystem = `Você é Jadi, uma assistente de desenvolvimento de software inteligente integrada na plataforma Jadi.ia.
Você ajuda desenvolvedores brasileiros a criar sites, sistemas, web apps e aplicativos mobile.
Responda sempre em português do Brasil.
${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
${language && language !== "auto" ? `Linguagem principal do projeto: ${language}` : ""}
Quando fornecer código, sempre use blocos de código com a linguagem especificada (ex: \`\`\`javascript).
Seja direta e técnica. Explique o necessário, mas priorize código funcional e completo.`;

  const systemContent = systemPrompt ? `${baseSystem}\n\n${systemPrompt}` : baseSystem;

  const groqMessages = [{ role: "system", content: systemContent }, ...messages];

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 8192,
        stream: true,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      sendEvent("error", { message: `Groq API error: ${errText}` });
      res.end();
      return;
    }

    const reader = groqResponse.body!.getReader();
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
          if (token) {
            sendEvent("token", { token });
          }
        } catch {
          // skip malformed chunk
        }
      }
    }

    sendEvent("done", {});
    res.end();
  } catch (error) {
    logger.error({ error }, "Erro no streaming SSE");
    sendEvent("error", { message: "Erro ao processar streaming" });
    res.end();
  }
});

export default router;
