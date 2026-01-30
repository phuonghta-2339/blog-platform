import { baseLayout } from './base.layout';
import { tw } from './tailwind.styles';
import {
  NewFollowerEmailVars,
  RenderedEmail,
} from '@modules/mail/interfaces/template.interfaces';

/**
 * Render new follower notification email
 */
export const renderNewFollowerTemplate = (
  variables: NewFollowerEmailVars,
): RenderedEmail => {
  const html = baseLayout({
    title: 'New Follower',
    headerEmoji: '👥',
    headerTitle: 'You Have a New Follower!',
    previewText: `${variables.followerName} is now following you on Blog Platform.`,
    contentHtml: `
      <p style="${tw.p}">Hi <strong style="${tw.strong}">${variables.authorName}</strong>,</p>
      <p style="${tw.p}">
        Great news! <span style="${tw.badge} ${tw.badgeInfo}">${variables.followerName}</span> is now following you on Blog Platform.
      </p>
      <p style="${tw.p}">
        They'll be notified when you publish new articles, helping you build a loyal audience for your writing.
      </p>
      <div style="${tw.divider}"></div>
      <div style="${tw.buttonContainer}">
        <a href="${variables.profileUrl}" style="${tw.button}">
          View Their Profile
        </a>
      </div>
      <div style="${tw.divider}"></div>
      <p style="${tw.footerText}">
        Keep creating amazing content! Building relationships with your readers is key to growing your influence.
      </p>
    `,
  });

  const text = `
You Have a New Follower!

Hi ${variables.authorName},

Great news! ${variables.followerName} is now following you on Blog Platform.

This means they're interested in your content and want to stay updated with your latest posts.

View their profile: ${variables.profileUrl}

Keep creating amazing content!

Best regards,
The Blog Platform Team
  `.trim();

  return { html, text };
};
