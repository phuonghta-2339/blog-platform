import { baseLayout } from './base.layout';
import { tw } from './tailwind.styles';
import {
  WelcomeEmailVars,
  RenderedEmail,
} from '@modules/mail/interfaces/template.interfaces';

/**
 * Render welcome email
 */
export const renderWelcomeTemplate = (
  variables: WelcomeEmailVars,
): RenderedEmail => {
  const html = baseLayout({
    title: 'Welcome to Blog Platform',
    headerEmoji: '🎉',
    headerTitle: 'Welcome to Blog Platform!',
    previewText: `Hi ${variables.username}, welcome to our community of writers and explorers.`,
    contentHtml: `
      <p style="${tw.p}">Hi <strong style="${tw.strong}">${variables.username}</strong>,</p>
      <p style="${tw.p}">
        Thank you for joining our community! We're absolutely thrilled to have you on board.
      </p>
      <div style="${tw.divider}"></div>
      <h2 style="${tw.h2}">Ready to start your journey?</h2>
      <p style="${tw.p}">
        Your account is now active. You can start exploring top-rated articles, following your favorite authors, and sharing your own voice with the world.
      </p>
      <div style="${tw.buttonContainer}">
        <a href="${variables.loginUrl}" style="${tw.button}">
          Get Started Now
        </a>
      </div>
      <div style="${tw.divider}"></div>
      <p style="${tw.footerText}">
        If you have any questions, simply reply to this email. Our support team is always here to help.
      </p>
    `,
  });

  const text = `
Welcome to Blog Platform!

Hi ${variables.username},

Thank you for joining our community! We're excited to have you on board.

Your account is now active. Start exploring, writing, and connecting with other authors.

Get started: ${variables.loginUrl}

Happy writing!
The Blog Platform Team
  `.trim();

  return { html, text };
};
