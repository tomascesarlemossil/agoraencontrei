import { NextRequest, NextResponse } from "next/server";

/**
 * Realtime session bootstrap endpoint.
 *
 * Cria uma sessão efêmera para o navegador conectar via WebRTC à OpenAI Realtime API.
 * Este padrão é o recomendado pela documentação oficial — o browser solicita uma
 * credencial temporária ao nosso servidor (que mantém a chave principal segura) e
 * usa o `client_secret.value` devolvido para negociar a conexão SDP.
 *
 * Requer OPENAI_API_KEY configurada no ambiente.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const model = body?.model || "gpt-realtime-1.5";
  const voice = body?.voice || "marin";
  const instructions =
    body?.instructions ||
    "Você é o Tomás, consultor imobiliário local de Franca/SP. Fale de forma humana, objetiva e segura.";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada" },
      { status: 500 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      instructions,
      audio: {
        input: {
          turn_detection: {
            type: "server_vad",
          },
        },
      },
    }),
  });

  const data = await response.json().catch(() => ({ error: "Resposta inválida da OpenAI" }));
  return NextResponse.json(data, { status: response.status });
}
