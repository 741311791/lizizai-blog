import { Resend } from 'resend';

export default {
  provider: 'resend',
  name: 'Resend',
  
  init: (providerOptions: any, settings: any) => {
    const resend = new Resend(providerOptions.apiKey);
    
    return {
      send: async (options: any) => {
        try {
          const { to, from, subject, text, html } = options;
          
          const result = await resend.emails.send({
            from: from || settings.defaultFrom,
            to: Array.isArray(to) ? to : [to],
            subject,
            text,
            html,
          });
          
          return result;
        } catch (error) {
          throw error;
        }
      },
    };
  },
};
