import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(
  to: string,
  name: string,
  confirmationUrl: string
): Promise<void> {
  const { getConfirmationEmailTemplate } = await import('./email-templates');
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'future/proof <newsletter@lizizai.xyz>',
      to: [to],
      subject: 'Confirm your subscription to future/proof',
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
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'future/proof <newsletter@lizizai.xyz>',
      to: [to],
      subject: 'Welcome to future/proof! 🎉',
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
