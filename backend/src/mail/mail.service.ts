import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dns from 'dns';
import * as net from 'net';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly host: string;
  private readonly port: number;
  private readonly auth: { user: string; pass: string } | undefined;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from =
      this.config.get<string>('MAIL_FROM') ??
      'BYT Trading <no-reply@byttrading.com>';
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'https://byttrading.com';
    this.host = this.config.get<string>('MAIL_HOST') ?? '';
    this.port = Number(this.config.get<string>('MAIL_PORT')) || 587;
    const user = this.config.get<string>('MAIL_USER');
    this.auth = user
      ? { user, pass: this.config.get<string>('MAIL_PASSWORD') ?? '' }
      : undefined;
  }

  // nodemailer resolves both A and AAAA records for a hostname and picks
  // one at random to connect to (see node_modules/nodemailer/lib/shared).
  // Render has no outbound IPv6 route, so whenever it randomly picked the
  // AAAA address for a dual-stack host like Hostinger's, the connection
  // failed instantly with ENETUNREACH. There is no transport option that
  // changes this behaviour, so we resolve the A record ourselves and hand
  // nodemailer a literal IP, which makes it skip its own DNS step entirely.
  private async resolveIPv4Host(): Promise<string> {
    if (!this.host || net.isIP(this.host)) return this.host;
    try {
      const addresses = await dns.promises.resolve4(this.host);
      if (addresses.length) return addresses[0];
    } catch (error) {
      this.logger.warn(
        `Falling back to hostname, IPv4 resolution failed for ${this.host}: ${(error as Error).message}`,
      );
    }
    return this.host;
  }

  private buildTransporter(host: string): nodemailer.Transporter {
    return nodemailer.createTransport({
      host,
      port: this.port,
      // Port 465 is implicit TLS (connect already encrypted); anything else
      // (e.g. 587) uses STARTTLS, which nodemailer negotiates when secure
      // is false. Hardcoding false broke providers like Hostinger on 465.
      secure: this.port === 465,
      auth: this.auth,
      // host above may be a resolved IP literal rather than the real
      // hostname, so pin TLS's SNI/certificate check to the real hostname
      // explicitly, otherwise validation would run against the IP instead.
      tls: { servername: this.host },
      // Without these, an unreachable/firewalled host (common on cloud
      // hosts like Render, which some SMTP providers silently drop instead
      // of refusing) leaves nodemailer waiting on the OS's TCP timeout,
      // which can be minutes. Cap every stage so a bad connection fails
      // fast instead of hanging the caller.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
  }

  // Every email shares the same branded header and footer, only the middle
  // content differs per template. Table based layout since email clients
  // don't reliably support modern CSS (flex, grid).
  private wrapTemplate(contentHtml: string): string {
    return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:480px;">
            <tr>
              <td style="background-color:#ffffff;padding:24px 32px;border-bottom:1px solid #e4e4e7;">
                <a href="${this.frontendUrl}" style="text-decoration:none;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align:middle;padding-right:10px;">
                        <img src="${this.frontendUrl}/images/brand/byt-logo-mark.png" width="64" height="26" alt="BYT Trading" style="display:block;border:0;height:26px;width:64px;" />
                      </td>
                      <td style="vertical-align:middle;color:#0d9488;font-size:20px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">BYT Trading</td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#18181b;font-size:15px;line-height:1.6;">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px;line-height:1.6;">
                <p style="margin:0 0 4px;">BYT Trading, Level 12, 123 Collins Street, Melbourne VIC 3000, Australia</p>
                <p style="margin:0;">Need help? Contact support at support@byttrading.com</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private async send(to: string, subject: string, contentHtml: string) {
    try {
      const host = await this.resolveIPv4Host();
      await this.buildTransporter(host).sendMail({
        from: this.from,
        to,
        subject,
        html: this.wrapTemplate(contentHtml),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send email to ${to}: ${(error as Error).message}`,
      );
    }
  }

  async sendWelcomeEmail(to: string, firstName: string, verifyUrl: string) {
    await this.send(
      to,
      'Welcome to BYT Trading',
      `<p>Hi ${firstName},</p>
       <p>Welcome to BYT Trading. Your account has been created and you are ready to get started.</p>
       <p>Fund your wallet and subscribe to a bot when you are set to start trading.</p>
       <p>Click the link below to verify your email address:</p>
       <p><a href="${verifyUrl}">Verify your email</a></p>
       <p>This link expires in 24 hours.</p>`,
    );
  }

  async sendVerificationEmail(to: string, firstName: string, verifyUrl: string) {
    await this.send(
      to,
      'Verify your BYT Trading account',
      `<p>Hi ${firstName},</p>
       <p>Please confirm your email address to verify your BYT Trading account:</p>
       <p><a href="${verifyUrl}">Verify your email</a></p>
       <p>This link expires in 24 hours.</p>`,
    );
  }

  async sendOtpEmail(to: string, code: string) {
    await this.send(
      to,
      'Your BYT Trading login code',
      `<p>Your one time login code is:</p>
       <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
       <p>This code expires in 10 minutes. If you did not request this, ignore this email.</p>`,
    );
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    await this.send(
      to,
      'Reset your BYT Trading password',
      `<p>We received a request to reset your password:</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
    );
  }

  async sendDepositConfirmedEmail(
    to: string,
    firstName: string,
    amount: string,
    symbol: string,
    usdEquivalent: string | null,
  ) {
    await this.send(
      to,
      'Your deposit has been confirmed',
      `<p>Hi ${firstName},</p>
       <p>Your deposit of ${amount} ${symbol}${usdEquivalent ? ` (about $${usdEquivalent})` : ''} has been confirmed and credited to your wallet.</p>
       <p><a href="${this.frontendUrl}/wallet">View your wallet</a></p>`,
    );
  }

  async sendWithdrawalConfirmedEmail(
    to: string,
    firstName: string,
    amount: string,
    symbol: string,
    usdEquivalent: string | null,
  ) {
    await this.send(
      to,
      'Your withdrawal has been confirmed',
      `<p>Hi ${firstName},</p>
       <p>Your withdrawal of ${amount} ${symbol}${usdEquivalent ? ` (about $${usdEquivalent})` : ''} has been confirmed and sent.</p>
       <p><a href="${this.frontendUrl}/transactions">View your transactions</a></p>`,
    );
  }

  async sendSubscriptionConfirmedEmail(
    to: string,
    firstName: string,
    planName: string,
    termLabel: string,
  ) {
    await this.send(
      to,
      `You are subscribed to ${planName}`,
      `<p>Hi ${firstName},</p>
       <p>You are now subscribed to ${planName} for ${termLabel}. You can place as many trades as you like with this bot for the life of your subscription.</p>
       <p><a href="${this.frontendUrl}/trading?addTrade=1">Place a trade</a></p>`,
    );
  }

  async sendTradePlacedEmail(
    to: string,
    firstName: string,
    planName: string,
    principalUsd: string,
  ) {
    await this.send(
      to,
      `Your trade with ${planName} has started`,
      `<p>Hi ${firstName},</p>
       <p>Your trade of $${principalUsd} with ${planName} is now active and accruing profit.</p>
       <p><a href="${this.frontendUrl}/trading">View your trades</a></p>`,
    );
  }

  async sendTradeCompletedEmail(
    to: string,
    firstName: string,
    planName: string,
    principalUsd: string,
    profitUsd: string,
  ) {
    await this.send(
      to,
      `Your trade with ${planName} is complete`,
      `<p>Hi ${firstName},</p>
       <p>Your trade cycle with ${planName} has completed. Your principal of $${principalUsd} plus $${profitUsd} in profit has been credited back to your wallet.</p>
       <p><a href="${this.frontendUrl}/trading">View your trades</a></p>`,
    );
  }

  // For admin-sent notifications and system bonus emails, where the subject
  // and body are provided by the caller instead of being one of the fixed
  // templates above.
  async sendCustomEmail(to: string, subject: string, bodyHtml: string) {
    await this.send(to, subject, bodyHtml);
  }
}
