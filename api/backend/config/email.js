import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Garantir que as variáveis de ambiente estão carregadas
dotenv.config();

// Configuração do transportador de email
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // Gmail, Outlook, etc.
  auth: {
    user: process.env.EMAIL_USER, // Seu email
    pass: process.env.EMAIL_PASSWORD  // Senha de aplicativo (não a senha normal)
  },
  tls: {
    rejectUnauthorized: false // Aceita certificados autoassinados em desenvolvimento
  }
});

/**
 * Envia um email de recuperação de senha
 * @param {string} destinatario - Email do destinatário
 * @param {string} nomeUsuario - Nome do usuário
 * @param {string} token - Token de recuperação
 * @returns {Promise} - Promise com o resultado do envio
 */
export async function enviarEmailRecuperacao(destinatario, nomeUsuario, token) {
  const urlRecuperacao = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: destinatario,
    subject: 'Recuperação de Senha - Caderno do Chef',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #f0f0f0;
          }
          .header h1 {
            color: #333;
            margin: 0;
          }
          .content {
            padding: 30px 20px;
          }
          .content p {
            color: #666;
            line-height: 1.6;
            margin: 15px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background-color: #45a049;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            padding: 20px;
            border-top: 2px solid #f0f0f0;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${nomeUsuario}</strong>!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Caderno do Chef</strong>.</p>
            <p>Para criar uma nova senha, clique no botão abaixo:</p>
            <center>
              <a href="${urlRecuperacao}" class="button">Redefinir Senha</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #4CAF50;">${urlRecuperacao}</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este link é válido por <strong>1 hora</strong></li>
                <li>Se você não solicitou esta recuperação, ignore este email</li>
                <li>Nunca compartilhe este link com outras pessoas</li>
              </ul>
            </div>
            <p>Se tiver alguma dúvida, entre em contato com nossa equipe de suporte.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Caderno do Chef. Todos os direitos reservados.</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email de recuperação enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

export default transporter;
