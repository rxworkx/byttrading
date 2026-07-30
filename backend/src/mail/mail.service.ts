import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from =
      this.config.get<string>('MAIL_FROM') ??
      'BYT Trading <no-reply@byttrading.com>';
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'https://byttrading.com';
    const port = Number(this.config.get<string>('MAIL_PORT')) || 587;
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port,
      // Port 465 is implicit TLS (connect already encrypted); anything else
      // (e.g. 587) uses STARTTLS, which nodemailer negotiates when secure
      // is false. Hardcoding false broke providers like Hostinger on 465.
      secure: port === 465,
      auth: this.config.get<string>('MAIL_USER')
        ? {
            user: this.config.get<string>('MAIL_USER'),
            pass: this.config.get<string>('MAIL_PASSWORD'),
          }
        : undefined,
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
              <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;">
                <a href="${this.frontendUrl}" style="color:#ffffff;font-size:20px;font-weight:bold;text-decoration:none;">BYT Trading</a>
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
      await this.transporter.sendMail({
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
