import { Router, type IRouter } from "express";
import { AiChatBody, GeneratePromptBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(messages: { role: string; content: string }[], model = "llama3-70b-8192"): Promise<string> {
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

  const { messages, projectContext, language } = parsed.data;

  const systemMessage = {
    role: "system",
    content: `Você é Jadi, uma assistente de desenvolvimento de software inteligente integrada na plataforma Jadi.ia. 
Você ajuda desenvolvedores brasileiros a criar sites, sistemas, web apps e aplicativos mobile.
Responda sempre em português do Brasil.
${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
${language ? `Linguagem principal do projeto: ${language}` : ""}
Quando fornecer código, sempre use blocos de código com a linguagem especificada (ex: \`\`\`javascript).
Seja concisa, direta e técnica. Explique apenas o necessário.`,
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

export default router;
