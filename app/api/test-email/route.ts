import { NextResponse } from "next/server";

export async function GET() {
  const nodemailer = await import("nodemailer");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "hugo.resende@mv.com.br",
      subject: "Email de Teste - Solicitação Demo Platform",
      html: `
        <h2>Email de Teste</h2>
        <p>Este é um email de teste para verificar se o sistema de notificações está funcionando corretamente.</p>
        <p><b>De:</b> ${process.env.GMAIL_USER}</p>
        <p><b>Para:</b> hugo.resende@mv.com.br</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Email enviado com sucesso!",
      messageId: result.messageId
    });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 });
  }
}
