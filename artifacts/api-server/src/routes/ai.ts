import { Router, type IRouter } from "express";
import { AiChatBody, GeneratePromptBody, AnalyzeStackBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_CODER_MODEL = "llama-3.3-70b-versatile";
const GROQ_FALLBACK_MODEL = "llama-3.1-8b-instant";

const FONT_PAIRS_LOCAL: Record<string, { heading: string; body: string; weights: string }> = {
  modern: { heading: "Inter", body: "Inter", weights: "400;500;600;700" },
  editorial: { heading: "Playfair+Display", body: "Source+Sans+3", weights: "400;600;700" },
  tech: { heading: "Space+Grotesk", body: "JetBrains+Mono", weights: "400;500;700" },
  elegant: { heading: "Cormorant+Garamond", body: "Lato", weights: "300;400;700" },
  bold: { heading: "Montserrat", body: "Open+Sans", weights: "400;600;800" },
  minimal: { heading: "DM+Sans", body: "DM+Sans", weights: "300;400;500;700" },
  creative: { heading: "Syne", body: "Nunito", weights: "400;600;700;800" },
  corporate: { heading: "Roboto", body: "Roboto", weights: "300;400;500;700" },
};

function detectFontMood(description: string): string {
  const d = description.toLowerCase();
  if (/tech|startup|saas|app|software|dev|código|code|digital/.test(d)) return "tech";
  if (/luxo|luxury|premium|elegant|fashion|moda|beleza|beauty|spa/.test(d)) return "elegant";
  if (/blog|editorial|artigo|notícia|revista|magazine|jornal/.test(d)) return "editorial";
  if (/bold|imapct|esport|sport|energia|energy|academia|fitness/.test(d)) return "bold";
  if (/minimal|clean|simples|simple|branco|white|zen/.test(d)) return "minimal";
  if (/arte|art|design|criativ|agência|agency|portfolio|estúdio/.test(d)) return "creative";
  if (/empresa|corporat|b2b|negócio|business|consult|financ|banco/.test(d)) return "corporate";
  return "modern";
}

function extractImageQueries(description: string): string[] {
  const words = description.toLowerCase();
  const queries: string[] = [];
  if (/clínica|clinic|médico|medical|saúde|health|fisio/.test(words)) queries.push("modern clinic interior", "healthcare professional");
  else if (/restaurante|restaurant|food|comida|gastro/.test(words)) queries.push("restaurant interior", "food photography");
  else if (/tech|software|startup|app/.test(words)) queries.push("technology office", "modern workspace");
  else if (/moda|fashion|roupas|clothes/.test(words)) queries.push("fashion editorial", "modern clothing store");
  else if (/academia|fitness|sport|esporte/.test(words)) queries.push("gym workout", "fitness lifestyle");
  else if (/imóvel|imobiliária|real estate|apartamento/.test(words)) queries.push("modern apartment interior", "real estate architecture");
  else if (/viagem|travel|turismo|tourism/.test(words)) queries.push("travel destination", "adventure landscape");
  else queries.push("modern business", "professional workspace");
  return queries.slice(0, 3);
}

async function fetchImagesLocal(query: string, count = 3): Promise<string[]> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } },
      );
      if (res.ok) {
        const data = await res.json() as { results?: Array<{ urls?: { regular?: string } }> };
        const urls = (data.results ?? []).map((r) => r.urls?.regular).filter((u): u is string => !!u);
        if (urls.length > 0) return urls;
      }
    } catch { /* fallback to pixabay */ }
  }
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (pixabayKey) {
    try {
      const url = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=${count}&safesearch=true`;
      const res = await fetch(url, { headers: { "Referer": "https://pixabay.com" } });
      if (res.ok) {
        const data = await res.json() as { hits?: Array<{ webformatURL?: string }> };
        return (data.hits ?? []).map((h) => h.webformatURL).filter((u): u is string => !!u);
      }
    } catch { /* no images */ }
  }
  return [];
}

type OpenAIMessage = { role: string; content: string | unknown[] };

function toGeminiContents(messages: OpenAIMessage[]): {
  systemInstruction?: { parts: { text: string }[] };
  contents: { role: string; parts: { text: string }[] }[];
} {
  let systemInstruction: { parts: { text: string }[] } | undefined;
  const contents: { role: string; parts: { text: string }[] }[] = [];

  for (const msg of messages) {
    const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    if (msg.role === "system") {
      systemInstruction = { parts: [{ text }] };
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text }],
      });
    }
  }
  return { systemInstruction, contents };
}

async function callGeminiText(messages: OpenAIMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const { systemInstruction, contents } = toGeminiContents(messages);

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  };
  if (systemInstruction) body.system_instruction = systemInstruction;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
}

async function streamGemini(
  messages: OpenAIMessage[],
  onToken: (token: string) => void,
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const { systemInstruction, contents } = toGeminiContents(messages);

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  };
  if (systemInstruction) body.system_instruction = systemInstruction;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw Object.assign(new Error(`Gemini API error: ${err}`), { status: res.status });
  }

  const reader = res.body!.getReader();
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
      const payload = trimmed.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onToken(text);
      } catch {
        // skip malformed chunk
      }
    }
  }
}

async function callGroq(
  messages: OpenAIMessage[],
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

async function callGroqText(messages: OpenAIMessage[], model = "llama-3.3-70b-versatile"): Promise<string> {
  const res = await callGroq(messages, model, false);
  if (!res.ok) {
    const err = await res.text();
    throw Object.assign(new Error(`Groq API error: ${err}`), { status: res.status });
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

async function callGeminiVision(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const body = {
    contents: [{
      role: "user",
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Image } },
        { text: prompt },
      ],
    }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini Vision API error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
}

function extractCodeBlocks(text: string): string[] {
  const regex = /```(?:\w+)?\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) blocks.push(match[1].trim());
  return blocks;
}

router.post("/ai/chat", requireAuth, async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { messages, projectContext, language, systemPrompt } = parsed.data;

  const baseSystemContent = `Você é Jadi, uma assistente de desenvolvimento de software inteligente integrada na plataforma Jad.ia.
Você ajuda desenvolvedores brasileiros a criar sites, sistemas, web apps e aplicativos mobile.
Responda sempre em português do Brasil.
${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
${language && language !== "auto" ? `Linguagem principal do projeto: ${language}` : ""}
Quando fornecer código, sempre use blocos de código com a linguagem especificada (ex: \`\`\`javascript).
Seja concisa, direta e técnica. Explique apenas o necessário.`;

  const systemContent = systemPrompt ? `${baseSystemContent}\n\n${systemPrompt}` : baseSystemContent;
  const systemMessage = { role: "system", content: systemContent };

  try {
    const responseText = await callGroqText([systemMessage, ...messages]);
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

  const messages: OpenAIMessage[] = [
    {
      role: "system",
      content: `Você é um agente técnico especializado em gerar prompts otimizados para desenvolvimento de software.
Seu objetivo é transformar descrições simples em prompts técnicos detalhados para guiar a criação de sistemas.
Responda sempre em português do Brasil.
Formate a resposta como JSON com campos "prompt" (string) e "suggestions" (array de strings com sugestões adicionais).`,
    },
    {
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
    },
  ];

  try {
    const responseText = await callGroqText(messages);
    let promptData: { prompt: string; suggestions: string[] };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      promptData = jsonMatch ? JSON.parse(jsonMatch[0]) : { prompt: responseText, suggestions: [] };
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

  const messages: OpenAIMessage[] = [
    {
      role: "system",
      content: `Você é o SISTEMA ANALISTA do Jad.ia, especializado em arquitetura de software e seleção de tecnologias.
Sua missão é analisar a descrição de um projeto e recomendar a stack tecnológica ideal.
Utilize raciocínio técnico preciso. Responda SEMPRE em formato JSON válido, sem texto extra antes ou depois.
Use linguagem técnica clara e objetiva. Responda em português do Brasil.`,
    },
    {
      role: "user",
      content: `Analise o projeto abaixo e recomende a melhor stack tecnológica e identidade visual:

Nome do projeto: ${projectName}
Descrição: ${description}
${projectType ? `Tipo de projeto (sugestão do usuário): ${projectType}` : ""}

Responda com um JSON no seguinte formato:
{
  "language": "linguagem principal (ex: TypeScript, Python, JavaScript)",
  "framework": "framework principal (ex: React, Django, Next.js, React Native)",
  "projectType": "tipo de projeto identificado (ex: E-commerce, App Mobile, API REST, Dashboard, Landing Page)",
  "justification": "Justificativa técnica de 1-2 frases explicando por que essa stack é ideal para este projeto",
  "systemPrompt": "Instrução técnica completa para guiar a IA na geração de código. Deve especificar linguagem, framework, padrões de código, estrutura de pastas e boas práticas. Seja detalhado e técnico.",
  "fontMood": "um dos: modern, editorial, tech, elegant, bold, minimal, creative, corporate",
  "colorPalette": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "accent": "#hexcolor",
    "background": "#hexcolor",
    "surface": "#hexcolor",
    "text": "#hexcolor"
  },
  "imageQueries": ["query1 em inglês", "query2 em inglês"]
}`,
    },
  ];

  try {
    const responseText = await callGeminiText(messages);

    let stackData: {
      language: string;
      framework: string;
      projectType: string;
      justification: string;
      systemPrompt: string;
      fontMood?: string;
      colorPalette?: Record<string, string>;
      imageQueries?: string[];
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
        fontMood: "modern",
        colorPalette: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#06b6d4", background: "#0f172a", surface: "#1e293b", text: "#f8fafc" },
        imageQueries: ["technology workspace", "modern web design"],
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
    messages: OpenAIMessage[];
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
    ? `Você é o SISTEMA ANALISTA do Jad.ia. Especialista em arquitetura de software, análise de requisitos e planejamento técnico.
Analise projetos com profundidade técnica, gere diagnósticos precisos e planos estruturados.
Use linguagem técnica objetiva. Formate respostas em listas técnicas claras.
Responda sempre em português do Brasil.
${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
${language && language !== "auto" ? `Linguagem principal: ${language}` : ""}`
    : `Você é o SISTEMA CONSTRUTOR do Jad.ia. Executor especializado em geração de código limpo, funcional e bem estruturado.
Você transforma planos em código real. Priorize código funcional e completo acima de tudo.
Sempre use blocos de código com linguagem especificada (ex: \`\`\`javascript).
Responda sempre em português do Brasil.

PADRÕES OBRIGATÓRIOS DE TECNOLOGIA:
- Use sempre Tailwind CSS (via CDN: <script src="https://cdn.tailwindcss.com"></script>) para estilização — evite CSS puro extensivo.
- Use sempre Lucide Icons (via CDN: <script src="https://unpkg.com/lucide@latest"></script>) para ícones — nunca escreva SVGs manuais desnecessários.
- Para projetos web simples (HTML/CSS/JS), inclua os CDNs no <head> automaticamente.
- Prefira componentes semânticos e classes utilitárias. Evite estilos inline quando Tailwind resolve.

${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
${language && language !== "auto" ? `Linguagem principal do projeto: ${language}` : ""}`;

  // Truncate systemPrompt to avoid 413 (payload too large)
  const MAX_SYSTEM_EXTRA = 4000;
  const safeSystemPrompt = systemPrompt && systemPrompt.length > MAX_SYSTEM_EXTRA
    ? systemPrompt.slice(0, MAX_SYSTEM_EXTRA)
    : systemPrompt;

  const systemContent = safeSystemPrompt ? `${baseSystem}\n\n${safeSystemPrompt}` : baseSystem;

  // Keep only last 8 messages to avoid 413 errors
  const MAX_MESSAGES = 8;
  const truncatedMessages = messages.slice(-MAX_MESSAGES);
  const fullMessages: OpenAIMessage[] = [{ role: "system", content: systemContent }, ...truncatedMessages];

  try {
    if (isAnalyst) {
      try {
        await streamGemini(fullMessages, (token) => {
          sendEvent("token", { token });
        });
        sendEvent("done", {});
        res.end();
        return;
      } catch (geminiErr: unknown) {
        const geminiStatus = (geminiErr as { status?: number })?.status;
        logger.warn({ geminiStatus }, "Gemini indisponível no analista, alternando para Groq...");
        sendEvent("provider_switch", { message: "Alternando para Groq..." });

        // Fallback to Groq for analyst when Gemini fails
        const groqRes = await callGroq(fullMessages, GROQ_CODER_MODEL, true);
        if (!groqRes.ok) {
          const fallbackRes = await callGroq(fullMessages, GROQ_FALLBACK_MODEL, true);
          if (!fallbackRes.ok) {
            if (geminiStatus === 429) {
              sendEvent("error", { message: "Servidores de IA sobrecarregados. Aguarde alguns segundos e tente novamente." });
            } else {
              sendEvent("error", { message: "Erro ao processar resposta do analista. Tente novamente." });
            }
            res.end();
            return;
          }
          const fallbackReader = fallbackRes.body!.getReader();
          const fallbackDecoder = new TextDecoder();
          let fallbackBuffer = "";
          while (true) {
            const { done, value } = await fallbackReader.read();
            if (done) break;
            fallbackBuffer += fallbackDecoder.decode(value, { stream: true });
            const lines = fallbackBuffer.split("\n");
            fallbackBuffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              const payload = trimmed.slice(6);
              if (payload === "[DONE]") { sendEvent("done", {}); res.end(); return; }
              try {
                const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) sendEvent("token", { token });
              } catch { /* skip */ }
            }
          }
          sendEvent("done", {});
          res.end();
          return;
        }
        const groqReader = groqRes.body!.getReader();
        const groqDecoder = new TextDecoder();
        let groqBuffer = "";
        while (true) {
          const { done, value } = await groqReader.read();
          if (done) break;
          groqBuffer += groqDecoder.decode(value, { stream: true });
          const lines = groqBuffer.split("\n");
          groqBuffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") { sendEvent("done", {}); res.end(); return; }
            try {
              const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) sendEvent("token", { token });
            } catch { /* skip */ }
          }
        }
        sendEvent("done", {});
        res.end();
        return;
      }
    }

    const groqModel = hasImages ? "meta-llama/llama-4-scout-17b-16e-instruct" : GROQ_CODER_MODEL;

    let groqRes: Response | null = null;
    try {
      groqRes = await callGroq(fullMessages, groqModel, true);
      if (!groqRes.ok && groqModel === GROQ_CODER_MODEL) {
        logger.warn(`Modelo primário indisponível (${groqRes.status}), tentando fallback...`);
        groqRes = await callGroq(fullMessages, GROQ_FALLBACK_MODEL, true);
      }
    } catch (err: unknown) {
      logger.warn({ err }, "Erro de rede no Groq, alternando para Gemini...");
      groqRes = null;
    }

    if (!groqRes || !groqRes.ok) {
      const groqStatus = groqRes?.status ?? "erro de rede";
      logger.warn(`Groq indisponível (status: ${groqStatus}), alternando para Gemini...`);
      sendEvent("provider_switch", { message: "Alternando para Gemini..." });

      // Add 1s delay if previous request just failed (rate limit cooldown)
      await new Promise((r) => setTimeout(r, 1000));

      try {
        await streamGemini(fullMessages, (token) => sendEvent("token", { token }));
        sendEvent("done", {});
        res.end();
        return;
      } catch (geminiErr: unknown) {
        const geminiStatus = (geminiErr as { status?: number })?.status;
        if (geminiStatus === 429) {
          sendEvent("error", { message: "Servidores de IA sobrecarregados. Aguarde alguns segundos e tente novamente." });
        } else {
          sendEvent("error", { message: "Erro ao processar resposta. Tente novamente." });
        }
        res.end();
        return;
      }
    }

    const reader = groqRes.body!.getReader();
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
  } catch (error) {
    logger.error({ error }, "Erro no streaming SSE");
    sendEvent("error", { message: "Erro ao processar streaming" });
    res.end();
  }
});

router.post("/ai/resolve-assets", requireAuth, async (req, res): Promise<void> => {
  const { projectDescription = "" } = req.body as { projectDescription?: string };

  const mood = detectFontMood(projectDescription);
  const fontPair = FONT_PAIRS_LOCAL[mood] ?? FONT_PAIRS_LOCAL.modern;
  const families = fontPair.heading === fontPair.body
    ? `family=${fontPair.heading}:wght@${fontPair.weights}`
    : `family=${fontPair.heading}:wght@${fontPair.weights}&family=${fontPair.body}:wght@${fontPair.weights}`;
  const googleFontsUrl = `https://fonts.googleapis.com/css2?${families}&display=swap`;

  const imageQueries = extractImageQueries(projectDescription);
  const imageResults: Record<string, string[]> = {};
  await Promise.all(
    imageQueries.map(async (query) => {
      imageResults[query] = await fetchImagesLocal(query, 3);
    }),
  );

  logger.info({ mood, imageQueries }, "Assets resolvidos via AI");
  res.json({
    fonts: {
      heading: fontPair.heading.replace(/\+/g, " "),
      body: fontPair.body.replace(/\+/g, " "),
      googleFontsUrl,
      cssVars: `--font-heading: '${fontPair.heading.replace(/\+/g, " ")}', sans-serif; --font-body: '${fontPair.body.replace(/\+/g, " ")}', sans-serif;`,
      mood,
    },
    images: imageResults,
    sounds: {},
  });
});

router.post("/ai/process-sketch", requireAuth, async (req, res): Promise<void> => {
  const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };

  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "imageBase64 e mimeType são obrigatórios" });
    return;
  }

  const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validMimeTypes.includes(mimeType)) {
    res.status(400).json({ error: "Tipo de imagem inválido. Use JPEG, PNG, GIF ou WebP." });
    return;
  }

  const visionPrompt = `Você é um Engenheiro de UI especializado em Visão Computacional. Analise a imagem fornecida (rascunho/screenshot) e identifique:
1. Estrutura de layout (colunas, grid, flexbox, sidebar, etc.)
2. Componentes identificados (botões, inputs, cards, headers, navbars, tabelas, modais, etc.)
3. Hierarquia de texto (títulos h1/h2/h3, parágrafos, labels)
4. Paleta de cores sugerida (em formato hex)
5. Tipo de projeto (landing page, dashboard, app, e-commerce, etc.)

Responda exclusivamente com um JSON técnico descrevendo essa estrutura, incluindo as classes Tailwind CSS correspondentes. Formato:
{
  "layoutType": "...",
  "projectType": "...",
  "colorPalette": { "primary": "#...", "background": "#...", "text": "#..." },
  "components": [{ "type": "...", "description": "...", "tailwindClasses": "..." }],
  "hierarchy": { "h1": "...", "h2": "...", "body": "..." },
  "promptSuggestion": "Texto conciso descrevendo o projeto para usar como prompt de criação"
}`;

  try {
    const raw = await callGeminiVision(imageBase64, mimeType, visionPrompt);
    let analysis: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { promptSuggestion: raw };
    } catch {
      analysis = { promptSuggestion: raw };
    }
    logger.info("Sketch processado com Gemini Vision");
    res.json({ analysis, raw });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Erro ao processar sketch");
    res.status(500).json({ error: `Erro ao processar imagem: ${msg}` });
  }
});

router.post("/ai/optimize-code", requireAuth, async (req, res): Promise<void> => {
  const { content, language, projectContext } = req.body as {
    content?: string;
    language?: string;
    projectContext?: string;
  };

  if (!content || !content.trim()) {
    res.status(400).json({ error: "content é obrigatório" });
    return;
  }

  if (content.length > 80000) {
    res.status(400).json({ error: "Arquivo muito grande para otimização (máximo 80KB)" });
    return;
  }

  const messages: OpenAIMessage[] = [
    {
      role: "system",
      content: `Você é o Otimizador Silencioso da Jad.ia. Refatore o código para padrões profissionais sem alterar a funcionalidade visual ou lógica.

Aplique APENAS estas otimizações necessárias:
1. HTML SEMÂNTICO: Substitua <div> excessivos por <main>, <section>, <article>, <nav>, <footer>, <header>, <aside> quando apropriado
2. ACESSIBILIDADE (a11y): Adicione aria-label em elementos interativos sem texto visível, atributo alt em <img> sem alt, role quando necessário
3. SEO: Se for um arquivo HTML principal (index.html), adicione/melhore <title>, meta description e meta og:title, og:description relevantes ao conteúdo
4. PERFORMANCE: Adicione loading="lazy" em imagens fora da dobra inicial, remova estilos inline redundantes quando Tailwind já resolve
${projectContext ? `Contexto do projeto: ${projectContext}` : ""}

REGRA CRÍTICA: Retorne APENAS o código otimizado, sem explicações, comentários ou markdown. Preserve 100% da lógica, estilos e conteúdo original.`,
    },
    {
      role: "user",
      content: `Otimize este código ${language ?? "HTML"}:\n\n${content}`,
    },
  ];

  try {
    const optimized = await callGroqText(messages, GROQ_FALLBACK_MODEL);
    const codeMatch = optimized.match(/```[\w]*\n([\s\S]*?)```/);
    const cleanCode = codeMatch ? codeMatch[1].trim() : optimized.trim();
    res.json({ optimized: cleanCode });
  } catch (err: unknown) {
    logger.error({ err }, "Erro no otimizador silencioso");
    res.status(500).json({ error: "Erro ao otimizar código" });
  }
});

export default router;
