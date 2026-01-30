/**
 * Tailwind-inspired inline styles for Email Templates
 * Standardizes UI across all emails with professional aesthetics.
 */
export const tw = {
  // Layout
  body: 'margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; height: 100% !important; background-color: #f8fafc;',
  container: 'width: 100%; max-width: 600px; margin: 0 auto; padding: 20px 0;',
  wrapper:
    'background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin: 0 16px;',

  // Header (Gradient Brand)
  header:
    'background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 48px 32px; text-align: center;',
  headerTitle:
    'color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.025em; line-height: 1.2;',
  headerEmoji: 'font-size: 40px; margin-bottom: 16px; display: block;',

  // Content
  content: 'padding: 40px 32px;',
  p: "color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;",
  h2: 'color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 16px; line-height: 1.4;',
  strong: 'color: #1e293b; font-weight: 600;',

  // Buttons
  buttonContainer: 'text-align: center; margin: 32px 0 16px 0;',
  button:
    'background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 16px; font-weight: 700; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); transition: all 0.2s ease;',

  // Footer
  footer: 'padding: 32px; text-align: center; border-top: 1px solid #f1f5f9;',
  footerText: 'color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;',
  footerLink: 'color: #4f46e5; text-decoration: underline;',

  // Utils
  divider: 'height: 1px; background-color: #f1f5f9; margin: 32px 0;',
  badge:
    'display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;',
  badgeSuccess: 'background-color: #f0fdf4; color: #166534;',
  badgeInfo: 'background-color: #eff6ff; color: #1e40af;',
};
