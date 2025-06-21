// backend/shared/src/utils/email.ts
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

// Initialize Mailgun client
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_URL || 'https://api.mailgun.net' // For EU: 'https://api.eu.mailgun.net'
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (template: EmailTemplate) => {
  try {
    const messageData = {
      from: process.env.FROM_EMAIL || 'NewCondo <noreply@newcondo.com>',
      to: template.to,
      subject: template.subject,
      html: template.html,
      text: template.text || template.subject
    };

    const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);

    console.log('Email sent successfully:', result.id);
    return { success: true, data: result };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

export const sendOTPEmail = async (email: string, otp: string, type: string) => {
  const subject = getOTPEmailSubject(type);
  const html = generateOTPEmailHTML(otp, type);
  const text = generateOTPEmailText(otp, type);

  return sendEmail({
    to: email,
    subject,
    html,
    text
  });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const subject = 'Welcome to NewCondo!';
  const html = generateWelcomeEmailHTML(name);
  const text = generateWelcomeEmailText(name);

  return sendEmail({
    to: email,
    subject,
    html,
    text
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Reset Your NewCondo Password';
  const html = generatePasswordResetEmailHTML(resetUrl);
  const text = generatePasswordResetEmailText(resetUrl);

  return sendEmail({
    to: email,
    subject,
    html,
    text
  });
};

export const sendBulkEmail = async (templates: EmailTemplate[]) => {
  try {
    const promises = templates.map(template => sendEmail(template));
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    return {
      success: true,
      sent: successful,
      failed: failed,
      total: templates.length
    };
  } catch (error) {
    console.error('Bulk email sending failed:', error);
    return { success: false, error };
  }
};

export const sendTemplatedEmail = async (
  to: string,
  templateName: string,
  variables: Record<string, string>
) => {
  try {
    const messageData = {
      from: process.env.FROM_EMAIL || 'NewCondo <noreply@newcondo.com>',
      to: to,
      template: templateName,
      'h:X-Mailgun-Variables': JSON.stringify(variables)
    };

    const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);

    console.log('Templated email sent successfully:', result.id);
    return { success: true, data: result };
  } catch (error) {
    console.error('Templated email sending failed:', error);
    return { success: false, error };
  }
};

// Email template generators
const getOTPEmailSubject = (type: string): string => {
  switch (type) {
    case 'EMAIL_VERIFICATION':
      return 'Verify Your NewCondo Account';
    case 'LOGIN':
      return 'Your NewCondo Login Code';
    case 'PASSWORD_RESET':
      return 'Reset Your NewCondo Password';
    default:
      return 'Your NewCondo Verification Code';
  }
};

const generateOTPEmailHTML = (otp: string, type: string): string => {
  const purpose = type === 'EMAIL_VERIFICATION' ? 'verify your account' : 
                  type === 'LOGIN' ? 'complete your login' : 
                  'reset your password';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NewCondo - Verification Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">NewCondo</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
        <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>
        
        <p>Hi there!</p>
        
        <p>Use the following code to ${purpose}:</p>
        
        <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; border: 2px dashed #667eea; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${otp}</span>
        </div>
        
        <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes for security reasons.</p>
        
        <p>If you didn't request this code, please ignore this email or contact our support team.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Best regards,<br>The NewCondo Team</p>
          <p style="margin-top: 10px;">
            <a href="${process.env.FRONTEND_URL}" style="color: #667eea; text-decoration: none;">Visit NewCondo</a> | 
            <a href="${process.env.FRONTEND_URL}/support" style="color: #667eea; text-decoration: none;">Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateOTPEmailText = (otp: string, type: string): string => {
  const purpose = type === 'EMAIL_VERIFICATION' ? 'verify your account' : 
                  type === 'LOGIN' ? 'complete your login' : 
                  'reset your password';

  return `
NewCondo - Verification Code

Hi there!

Use the following code to ${purpose}: ${otp}

This code will expire in 10 minutes for security reasons.

If you didn't request this code, please ignore this email or contact our support team.

Visit NewCondo: ${process.env.FRONTEND_URL}
Support: ${process.env.FRONTEND_URL}/support

Best regards,
The NewCondo Team
  `;
};

const generateWelcomeEmailHTML = (name: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to NewCondo!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to NewCondo!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
        <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
        
        <p>Welcome to NewCondo - Nigeria's premier property rental platform!</p>
        
        <p>Your account has been successfully created. You can now:</p>
        
        <ul style="color: #666; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Browse and search for properties across Nigeria</li>
          <li style="margin-bottom: 8px;">List your own properties (for owners and agents)</li>
          <li style="margin-bottom: 8px;">Make secure rental payments</li>
          <li style="margin-bottom: 8px;">Connect with verified property owners and agents</li>
          <li style="margin-bottom: 8px;">Access property marking services</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Get Started</a>
        </div>
        
        <p>Need help getting started? Check out our <a href="${process.env.FRONTEND_URL}/help" style="color: #667eea;">help center</a> or contact our support team.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Best regards,<br>The NewCondo Team</p>
          <p style="margin-top: 10px;">
            <a href="${process.env.FRONTEND_URL}" style="color: #667eea; text-decoration: none;">Visit NewCondo</a> | 
            <a href="${process.env.FRONTEND_URL}/support" style="color: #667eea; text-decoration: none;">Support</a> | 
            <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color: #999; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateWelcomeEmailText = (name: string): string => {
  return `
Welcome to NewCondo!

Hello ${name}!

Welcome to NewCondo - Nigeria's premier property rental platform!

Your account has been successfully created. You can now:
- Browse and search for properties across Nigeria
- List your own properties (for owners and agents)
- Make secure rental payments
- Connect with verified property owners and agents
- Access property marking services

Get started: ${process.env.FRONTEND_URL}/dashboard

Need help getting started? Check out our help center: ${process.env.FRONTEND_URL}/help
Or contact our support team: ${process.env.FRONTEND_URL}/support

Best regards,
The NewCondo Team

Visit NewCondo: ${process.env.FRONTEND_URL}
  `;
};

const generatePasswordResetEmailHTML = (resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your NewCondo Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        
        <p>Hi there!</p>
        
        <p>We received a request to reset your NewCondo account password. Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
        
        <p style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <strong>Security tip:</strong> If you didn't request this password reset, please ignore this email or contact our support team immediately.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Best regards,<br>The NewCondo Team</p>
          <p style="margin-top: 10px;">
            <a href="${process.env.FRONTEND_URL}" style="color: #667eea; text-decoration: none;">Visit NewCondo</a> | 
            <a href="${process.env.FRONTEND_URL}/support" style="color: #667eea; text-decoration: none;">Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePasswordResetEmailText = (resetUrl: string): string => {
  return `
NewCondo - Password Reset

Hi there!

We received a request to reset your NewCondo account password. 

Reset your password: ${resetUrl}

This link will expire in 1 hour for security reasons.

SECURITY TIP: If you didn't request this password reset, please ignore this email or contact our support team immediately.

Support: ${process.env.FRONTEND_URL}/support

Best regards,
The NewCondo Team

Visit NewCondo: ${process.env.FRONTEND_URL}
  `;
};

// Email validation utility
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get email delivery status (Mailgun specific)
export const getEmailStatus = async (messageId: string) => {
  try {
    const events = await mg.events.get(MAILGUN_DOMAIN, {
      'message-id': messageId
    });
    
    return { success: true, events: events.items };
  } catch (error) {
    console.error('Failed to get email status:', error);
    return { success: false, error };
  }
};