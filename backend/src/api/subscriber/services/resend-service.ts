import { Resend } from 'resend';

// 延迟初始化 Resend 客户端,避免在模块加载时立即要求 API 密钥
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not configured. Please set it in your .env file to enable email functionality.'
      );
    }

    resend = new Resend(apiKey);
  }

  return resend;
}

export async function sendConfirmationEmail(
  to: string,
  name: string,
  confirmationUrl: string
): Promise<void> {
  const { getConfirmationEmailTemplate } = await import('./email-templates');

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Onboarding <onboarding@resend.dev>',
      to: [to],
      subject: 'Confirm your subscription to Zizai Blog',
      html: getConfirmationEmailTemplate(name, confirmationUrl),
    });

    if (error) {
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    console.log('Confirmation email sent successfully:', data);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<void> {
  const { getWelcomeEmailTemplate } = await import('./email-templates');

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Onboarding <onboarding@resend.dev>',
      to: [to],
      subject: 'Welcome to Zizai Blog! 🎉',
      html: getWelcomeEmailTemplate(name),
    });

    if (error) {
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    console.log('Welcome email sent successfully:', data);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}
