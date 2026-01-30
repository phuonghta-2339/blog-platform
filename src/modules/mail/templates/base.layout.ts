import { BaseLayoutProps } from '@modules/mail/interfaces/template.interfaces';
import { tw } from './tailwind.styles';

/**
 * Base layout for all email templates
 * Optimized for maximum deliverability and modern UI/UX Pro Max.
 */
export const baseLayout = ({
  title,
  headerEmoji = '✨',
  headerTitle,
  contentHtml,
  previewText,
}: BaseLayoutProps): string => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <title>${title}</title>
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <style>
      td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
    </style>
    <![endif]-->
  </head>
  <body style="${tw.body}">
    ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>` : ''}
    <div role="article" aria-roledescription="email" aria-label="${title}" lang="en">
      <table style="width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <div style="${tw.container}">
              <div style="${tw.wrapper}">
                <!-- Header -->
                <div style="${tw.header}">
                  <span style="${tw.headerEmoji}">${headerEmoji}</span>
                  <h1 style="${tw.headerTitle}">${headerTitle}</h1>
                </div>

                <!-- Main Content -->
                <div style="${tw.content}">
                  ${contentHtml}
                </div>

                <!-- Footer -->
                <div style="${tw.footer}">
                  <p style="${tw.footerText}">
                    &copy; ${new Date().getFullYear()} Blog Platform Inc. All rights reserved.
                  </p>
                  <p style="${tw.footerText}">
                    High performance platform for modern writers.
                  </p>
                  <p style="${tw.footerText}">
                    <a href="#" style="${tw.footerLink}">Settings</a> &bull;
                    <a href="#" style="${tw.footerLink}">Privacy Policy</a> &bull;
                    <a href="#" style="${tw.footerLink}">Help Center</a>
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`;
