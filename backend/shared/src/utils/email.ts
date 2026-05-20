// backend/shared/src/utils/email.ts
import formData from "form-data";
import Mailgun from "mailgun.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const mailgun = new Mailgun(formData);

// Initialize Mailgun client
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "",
  url: process.env.MAILGUN_URL || "https://api.mailgun.net", // For EU customers: 'https://api.eu.mailgun.net'
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "";

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface AccountUnlockedEmail {
  to: string;
  name: string;
  unlockedBy: "administrator" | "automatic";
}

export interface PasswordResetEmail {
  to: string;
  name: string | null;
  resetUrl?: string | null;
}

export interface AccountLockedEmail {
  to: string;
  name: string;
  lockedUntil: Date;
  unlockTime: string;
}

export const sendEmail = async (template: EmailTemplate) => {
  try {
    //TODO: Email service url
    const messageData = {
      from: process.env.FROM_EMAIL || "NewCondo <noreply@newcondo.com>",
      to: template.to,
      subject: template.subject,
      html: template.html,
      text: template.text || template.subject,
    };

    const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);

    console.log("Email sent successfully:", result.id);
    return { success: true, data: result };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
};

// export const sendOTPEmail = async (
//   email: string,
//   otp: string,
//   type: string
// ) => {
//   const subject = getOTPEmailSubject(type);
//   const html = generateOTPEmailHTML(otp, type);
//   const text = generateOTPEmailText(otp, type);

//   return sendEmail({
//     to: email,
//     subject,
//     html,
//     text,
//   });
// };

export const sendWelcomeEmail = async (email: string, name: string) => {
  const subject = "Welcome to NewCondo!";
  const html = generateWelcomeEmailHTML(name);
  const text = generateWelcomeEmailText(name);

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

export const sendPasswordResetEmail = async (data: PasswordResetEmail) => {
  const email = data.to;
  const subject = "Reset Your NewCondo Password";
  const html = generatePasswordResetEmailHTML(data.resetUrl!);
  const text = generatePasswordResetEmailText(data.resetUrl!);

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

export const sendPasswordChangeConfirmation = async (
  data: PasswordResetEmail
) => {
  const subject = "Your NewCondo Password Has Been Changed";
  const html = generatePasswordChangeConfirmationHTML(data.name || "User");
  const text = generatePasswordChangeConfirmationText(data.name || "User");

  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
};

export const sendAccountLockedEmail = async (data: AccountLockedEmail) => {
  const subject = "Account Temporarily Locked - NewCondo";
  const html = generateAccountLockedEmailHTML(
    data.name,
    data.lockedUntil,
    data.unlockTime
  );
  const text = generateAccountLockedEmailText(
    data.name,
    data.lockedUntil,
    data.unlockTime
  );

  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
};

export const sendAccountUnlockedEmail = async (data: AccountUnlockedEmail) => {
  const subject = "Account Unlocked - NewCondo";
  const html = generateAccountUnlockedEmailHTML(data.name, data.unlockedBy);
  const text = generateAccountUnlockedEmailText(data.name, data.unlockedBy);

  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
};

export const sendBulkEmail = async (templates: EmailTemplate[]) => {
  try {
    const promises = templates.map((template) => sendEmail(template));
    const results = await Promise.allSettled(promises);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    ).length;
    const failed = results.filter(
      (result) => result.status === "rejected"
    ).length;

    return {
      success: true,
      sent: successful,
      failed: failed,
      total: templates.length,
    };
  } catch (error) {
    console.error("Bulk email sending failed:", error);
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
      from: process.env.FROM_EMAIL || "NewCondo <noreply@newcondo.com>",
      to: to,
      template: templateName,
      "h:X-Mailgun-Variables": JSON.stringify(variables),
    };

    const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);

    console.log("Templated email sent successfully:", result.id);
    return { success: true, data: result };
  } catch (error) {
    console.error("Templated email sending failed:", error);
    return { success: false, error };
  }
};

// Email template generators
const getOTPEmailSubject = (type: string): string => {
  switch (type) {
    case "EMAIL_VERIFICATION":
      return "Verify Your NewCondo Account";
    case "LOGIN":
      return "Your NewCondo Login Code";
    case "PASSWORD_RESET":
      return "Reset Your NewCondo Password";
    default:
      return "Your NewCondo Verification Code";
  }
};

// Add this function to your email service
export const sendVerificationEmail = async (
  email: string,
  otpCode: string,
  name: string
) => {
  const subject = "Verify Your NewCondo Account";
  const html = generateVerificationEmailHTML(otpCode, name);
  const text = generateVerificationEmailText(otpCode, name);

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

// HTML template generator
const generateVerificationEmailHTML = (
  otpCode: string,
  name: string
): string => {
  const expireMinutes = 15; // Adjust based on your OTP expiration time

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
            NewCondo
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">

          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Verify Your Account
          </h2>
          
          <p style="color: #4b5563; margin: 16px 0; font-size: 16px;">
            Hi ${name}!
          </p>
          
          <p style="color: #4b5563; margin: 16px 0; font-size: 16px;">
            Welcome to NewCondo! To complete your account setup and start exploring Nigeria's premier property rental platform, please verify your email address using the code below:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background-color: #f3f4f6; border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px 32px;">
              <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #1d4ed8; letter-spacing: 8px;">
                ${otpCode}
              </span>
            </div>
          </div>
          
          <p style="color: #ef4444; margin: 16px 0; font-size: 15px; text-align: center; font-weight: 600;">
            This code will expire in ${expireMinutes} minutes for security reasons.
          </p>

          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 6px;">
            <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">
              How to verify:
            </h3>
            <ol style="margin: 0; padding-left: 20px; color: #1e40af;">
              <li style="margin: 6px 0;">Return to the NewCondo verification page</li>
              <li style="margin: 6px 0;">Enter the 6-digit code above</li>
              <li style="margin: 6px 0;">Click "Verify" to activate your account</li>
            </ol>
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 18px;">
              After verification, you can:
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li style="margin: 8px 0;">🏠 Browse and search properties across Nigeria</li>
              <li style="margin: 8px 0;">📋 List your own properties (for owners and agents)</li>
              <li style="margin: 8px 0;">💰 Make secure rental payments</li>
              <li style="margin: 8px 0;">🤝 Connect with verified property owners and agents</li>
              <li style="margin: 8px 0;">📍 Access property marking services</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL}/verify-email" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Verify My Account
            </a>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 6px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              🛡️ Security Notice: If you didn't create a NewCondo account, please ignore this email or contact our support team if you have concerns.
            </p>
          </div>

          <p style="color: #6b7280; margin: 16px 0; font-size: 14px;">
            Having trouble? You can request a new verification code from the verification page, or contact our support team for assistance.
          </p>

          <div style="text-align: center; margin: 32px 0 0 0; padding: 20px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
              Best regards,<br>
              The NewCondo Team
            </p>
            
            <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 14px;">
              <a href="${process.env.FRONTEND_URL}" style="color: #3b82f6; text-decoration: none;">Visit NewCondo</a> | 
              <a href="${process.env.FRONTEND_URL}/support" style="color: #3b82f6; text-decoration: none;">Support</a>
            </p>
          </div>

        </div>

      </div>
    </body>
    </html>
  `;
};

// Text template generator
const generateVerificationEmailText = (
  otpCode: string,
  name: string
): string => {
  const expireMinutes = 15; // Adjust based on your OTP expiration time

  return `
NewCondo - Verify Your Account

Hi ${name}!

Welcome to NewCondo! To complete your account setup and start exploring Nigeria's premier property rental platform, please verify your email address using the code below:

VERIFICATION CODE: ${otpCode}

This code will expire in ${expireMinutes} minutes for security reasons.

HOW TO VERIFY:
1. Return to the NewCondo verification page
2. Enter the 6-digit code above  
3. Click "Verify" to activate your account

After verification, you can:
- Browse and search properties across Nigeria
- List your own properties (for owners and agents)
- Make secure rental payments
- Connect with verified property owners and agents
- Access property marking services

Verify your account: ${process.env.FRONTEND_URL}/verify-email

SECURITY NOTICE: If you didn't create a NewCondo account, please ignore this email or contact our support team if you have concerns.

Having trouble? You can request a new verification code from the verification page, or contact our support team for assistance.

Support: ${process.env.FRONTEND_URL}/support

Best regards,
The NewCondo Team

Visit NewCondo: ${process.env.FRONTEND_URL}
  `;
};

const generateAccountUnlockedEmailHTML = (
  name: string,
  unlockedBy: "administrator" | "automatic"
): string => {
  const unlockedByText =
    unlockedBy === "administrator" ? "by an administrator" : "automatically";

  const unlockIcon = unlockedBy === "administrator" ? "🔓👨‍💼" : "🔓⏰";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Unlocked</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
            ${unlockIcon} Account Unlocked
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">

          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Hello ${name}!
          </h2>
          
          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 6px;">
            <p style="color: #065f46; margin: 0; font-weight: 600; font-size: 16px;">
              ✅ Good news! Your NewCondo account has been successfully unlocked ${unlockedByText}.
            </p>
          </div>

          <p style="color: #4b5563; margin: 16px 0; font-size: 16px;">
            Account Status:
          </p>

          <ul style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; list-style: none;">
            <li style="color: #374151; margin: 8px 0; font-size: 15px;">
              <strong>Status:</strong> 🟢 Active and accessible
            </li>
            <li style="color: #374151; margin: 8px 0; font-size: 15px;">
              <strong>Unlocked:</strong> ${new Date().toLocaleString()}
            </li>
            <li style="color: #374151; margin: 8px 0; font-size: 15px;">
              <strong>Unlocked by:</strong> ${unlockedBy === "administrator" ? "Administrator action" : "Automatic system unlock"}
            </li>
          </ul>

          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 18px;">
              You can now:
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li style="margin: 8px 0;">🏠 Access your dashboard and browse properties</li>
              <li style="margin: 8px 0;">💰 Make payments and manage bookings</li>
              <li style="margin: 8px 0;">📋 List properties (for owners and agents)</li>
              <li style="margin: 8px 0;">🔧 Use all NewCondo features normally</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Login to Your Account
            </a>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 6px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              🛡️ Security Reminder: To keep your account secure, please use a strong password and enable two-factor authentication if available. If you suspect any unauthorized access, change your password immediately.
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0 0 0; padding: 20px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
              Best regards,<br>
              The NewCondo Security Team
            </p>
            
            <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 14px;">
              <a href="${process.env.FRONTEND_URL}" style="color: #3b82f6; text-decoration: none;">Visit NewCondo</a> | 
              <a href="${process.env.FRONTEND_URL}/support" style="color: #3b82f6; text-decoration: none;">Support</a>
            </p>
          </div>

        </div>

      </div>
    </body>
    </html>
  `;
};

// Text template generator
const generateAccountUnlockedEmailText = (
  name: string,
  unlockedBy: "administrator" | "automatic"
): string => {
  const unlockedByText =
    unlockedBy === "administrator" ? "by an administrator" : "automatically";

  return `
NewCondo - Account Unlocked

Hello ${name}!

✅ GOOD NEWS: Your NewCondo account has been successfully unlocked ${unlockedByText}.

Account Status:
- Status: Active and accessible
- Unlocked: ${new Date().toLocaleString()}
- Unlocked by: ${unlockedBy === "administrator" ? "Administrator action" : "Automatic system unlock"}

You can now:
- Access your dashboard and browse properties
- Make payments and manage bookings
- List properties (for owners and agents)
- Use all NewCondo features normally

Login to your account: ${process.env.FRONTEND_URL}/login

SECURITY REMINDER: To keep your account secure, please use a strong password and enable two-factor authentication if available. If you suspect any unauthorized access, change your password immediately.

Support: ${process.env.FRONTEND_URL}/support

Best regards,
The NewCondo Security Team

Visit NewCondo: ${process.env.FRONTEND_URL}
  `;
};

export const generateOTPEmailHTML = (
  otp: string,
  type: string,
  expire: number
): string => {
  const purpose =
    type === "EMAIL_VERIFICATION"
      ? "verify your account"
      : type === "LOGIN"
        ? "complete your login"
        : "reset your password";

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
        
        <p style="color: #666; font-size: 14px;">This code will expire in ${expire} minutes for security reasons.</p>
        
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

export const generateOTPEmailText = (
  otp: string,
  type: string,
  expire: number
): string => {
  const purpose =
    type === "EMAIL_VERIFICATION"
      ? "verify your account"
      : type === "LOGIN"
        ? "complete your login"
        : "reset your password";

  return `
NewCondo - Verification Code

Hi there!

Use the following code to ${purpose}: ${otp}

This code will expire in ${expire} minutes for security reasons.

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

const generatePasswordChangeConfirmationHTML = (name: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed Successfully</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Changed</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
        <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>

        <div style="background: #d4edda; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745; margin: 20px 0;">
          <p style="margin: 0; color: #155724;"><strong>✓ Success!</strong> Your NewCondo account password has been successfully changed.</p>
        </div>

        <p>This email confirms that your password was changed on ${new Date().toLocaleString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          }
        )}.</p>

        <p style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately and consider securing your account.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/login" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Login to Your Account</a>
        </div>

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

const generatePasswordChangeConfirmationText = (name: string): string => {
  return `
NewCondo - Password Changed Successfully

Hello ${name}!

✓ SUCCESS: Your NewCondo account password has been successfully changed.

This email confirms that your password was changed on ${new Date().toLocaleString()}.

SECURITY NOTICE: If you didn't make this change, please contact our support team immediately and consider securing your account.

Login to your account: ${process.env.FRONTEND_URL}/login
Support: ${process.env.FRONTEND_URL}/support

Best regards,
The NewCondo Team

Visit NewCondo: ${process.env.FRONTEND_URL}
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

const generateAccountLockedEmailHTML = (
  name: string,
  lockedUntil: Date,
  unlockTime: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Temporarily Locked - NewCondo</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Account Locked</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
        <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
        
        <div style="background: #f8d7da; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p style="margin: 0; color: #721c24;"><strong>🔒 Security Alert:</strong> Your NewCondo account has been temporarily locked due to multiple failed login attempts.</p>
        </div>
        
        <p><strong>Account Details:</strong></p>
        <ul style="color: #666; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Locked at: ${new Date().toLocaleString()}</li>
          <li style="margin-bottom: 8px;">Locked until: ${lockedUntil.toLocaleString()}</li>
          <li style="margin-bottom: 8px;">Automatic unlock: ${unlockTime}</li>
        </ul>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>What to do:</strong></p>
          <ul style="margin: 10px 0 0 0; color: #856404; padding-left: 20px;">
            <li>Wait for the automatic unlock time</li>
            <li>If this wasn't you, change your password immediately after unlock</li>
            <li>Contact support if you suspect unauthorized access</li>
          </ul>
        </div>
        
        <p style="background: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #bee5eb; margin: 20px 0; color: #0c5460;">
          <strong>Security Tip:</strong> This lockout is a security measure to protect your account from unauthorized access attempts. Your account will automatically unlock at the specified time.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/support" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Contact Support</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Best regards,<br>The NewCondo Security Team</p>
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

const generateAccountLockedEmailText = (
  name: string,
  lockedUntil: Date,
  unlockTime: string
): string => {
  return `
NewCondo - Account Temporarily Locked

Hello ${name}!

⚠️ SECURITY ALERT: Your NewCondo account has been temporarily locked due to multiple failed login attempts.

Account Details:
- Locked at: ${new Date().toLocaleString()}
- Locked until: ${lockedUntil.toLocaleString()}
- Automatic unlock: ${unlockTime}

What to do:
- Wait for the automatic unlock time
- If this wasn't you, change your password immediately after unlock
- Contact support if you suspect unauthorized access

SECURITY TIP: This lockout is a security measure to protect your account from unauthorized access attempts. Your account will automatically unlock at the specified time.

Contact Support: ${process.env.FRONTEND_URL}/support

Best regards,
The NewCondo Security Team

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
      "message-id": messageId,
    });

    return { success: true, events: events.items };
  } catch (error) {
    console.error("Failed to get email status:", error);
    return { success: false, error };
  }
};
