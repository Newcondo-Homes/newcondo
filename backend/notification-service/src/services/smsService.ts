// backend/notification-service/src/services/smsService.ts

import axios from 'axios';

interface SMSParams {
  to: string;
  message: string;
  locale: string;
}

export class SMSService {
  private apiKey: string;
  private senderId: string;
  private baseUrl: string;

  constructor() {
    // Using Termii or Twilio for SMS
    this.apiKey = process.env.SMS_API_KEY || '';
    this.senderId = process.env.SMS_SENDER_ID || 'Newcondo';
    this.baseUrl = process.env.SMS_BASE_URL || 'https://api.ng.termii.com/api';
  }

  /**
   * Send verification OTP
   */
  async sendVerificationOTP(params: {
    phoneNumber: string;
    otpCode: string;
    userName: string;
    locale: string;
  }) {
    const { phoneNumber, otpCode, userName, locale } = params;

    const messages = {
      en: `Hi ${userName}, your Newcondo verification code is: ${otpCode}. Valid for 10 minutes.`,
      fr: `Bonjour ${userName}, votre code de vérification Newcondo est: ${otpCode}. Valide pendant 10 minutes.`,
      pcm: `Hello ${userName}, your Newcondo verification code na: ${otpCode}. E go work for 10 minutes.`
    };

    return this.sendSMS({
      to: phoneNumber,
      message: messages[locale as keyof typeof messages] || messages.en,
      locale
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(params: {
    phoneNumber: string;
    amount: string;
    propertyTitle: string;
    locale: string;
  }) {
    const { phoneNumber, amount, propertyTitle, locale } = params;

    const messages = {
      en: `Payment of ${amount} for ${propertyTitle} received. Please confirm within 24 hours on Newcondo dashboard.`,
      fr: `Paiement de ${amount} pour ${propertyTitle} reçu. Veuillez confirmer dans 24 heures sur le tableau de bord Newcondo.`,
      pcm: `We don receive your payment of ${amount} for ${propertyTitle}. Abeg confirm am within 24 hours for Newcondo dashboard.`
    };

    return this.sendSMS({
      to: phoneNumber,
      message: messages[locale as keyof typeof messages] || messages.en,
      locale
    });
  }

  /**
   * Send marking job assignment notification
   */
  async sendMarkingJobNotification(params: {
    phoneNumber: string;
    agentName: string;
    propertyAddress: string;
    deadline: string;
    locale: string;
  }) {
    const { phoneNumber, agentName, propertyAddress, deadline, locale } = params;

    const messages = {
      en: `Hi ${agentName}, you have a new marking job at ${propertyAddress}. Complete before ${deadline}. Check Newcondo app.`,
      fr: `Bonjour ${agentName}, vous avez une nouvelle mission à ${propertyAddress}. À terminer avant ${deadline}. Consultez l'app Newcondo.`,
      pcm: `Hello ${agentName}, you get new marking job for ${propertyAddress}. Do am before ${deadline}. Check Newcondo app.`
    };

    return this.sendSMS({
      to: phoneNumber,
      message: messages[locale as keyof typeof messages] || messages.en,
      locale
    });
  }

  /**
   * Send property approval notification
   */
  async sendPropertyApprovalSMS(params: {
    phoneNumber: string;
    ownerName: string;
    propertyTitle: string;
    approved: boolean;
    locale: string;
  }) {
    const { phoneNumber, ownerName, propertyTitle, approved, locale } = params;

    if (approved) {
      const messages = {
        en: `Good news ${ownerName}! Your property "${propertyTitle}" has been approved and is now live on Newcondo.`,
        fr: `Bonne nouvelle ${ownerName}! Votre propriété "${propertyTitle}" a été approuvée et est maintenant en ligne sur Newcondo.`,
        pcm: `Good news ${ownerName}! Your property "${propertyTitle}" don approve and e dey live for Newcondo now.`
      };

      return this.sendSMS({
        to: phoneNumber,
        message: messages[locale as keyof typeof messages] || messages.en,
        locale
      });
    } else {
      const messages = {
        en: `Hi ${ownerName}, your property "${propertyTitle}" needs revision. Check your Newcondo dashboard for details.`,
        fr: `Bonjour ${ownerName}, votre propriété "${propertyTitle}" nécessite une révision. Consultez votre tableau de bord Newcondo.`,
        pcm: `Hello ${ownerName}, your property "${propertyTitle}" need small correction. Check your Newcondo dashboard.`
      };

      return this.sendSMS({
        to: phoneNumber,
        message: messages[locale as keyof typeof messages] || messages.en,
        locale
      });
    }
  }

  /**
   * Send rental confirmation reminder
   */
  async sendRentalConfirmationReminder(params: {
    phoneNumber: string;
    renterName: string;
    hoursRemaining: number;
    locale: string;
  }) {
    const { phoneNumber, renterName, hoursRemaining, locale } = params;

    const messages = {
      en: `Hi ${renterName}, you have ${hoursRemaining} hours left to confirm your rental on Newcondo. Confirm now to avoid refund.`,
      fr: `Bonjour ${renterName}, il vous reste ${hoursRemaining} heures pour confirmer votre location sur Newcondo. Confirmez maintenant.`,
      pcm: `Hello ${renterName}, you get ${hoursRemaining} hours remain to confirm your rent for Newcondo. Confirm now make we no refund your money.`
    };

    return this.sendSMS({
      to: phoneNumber,
      message: messages[locale as keyof typeof messages] || messages.en,
      locale
    });
  }

  /**
   * Send funds released notification
   */
  async sendFundsReleasedSMS(params: {
    phoneNumber: string;
    recipientName: string;
    amount: string;
    locale: string;
  }) {
    const { phoneNumber, recipientName, amount, locale } = params;

    const messages = {
      en: `Hi ${recipientName}, ${amount} has been released to your Newcondo wallet. You can now withdraw to your bank account.`,
      fr: `Bonjour ${recipientName}, ${amount} a été libéré dans votre portefeuille Newcondo. Vous pouvez maintenant retirer vers votre compte bancaire.`,
      pcm: `Hello ${recipientName}, ${amount} don release to your Newcondo wallet. You fit withdraw am to your bank account now.`
    };

    return this.sendSMS({
      to: phoneNumber,
      message: messages[locale as keyof typeof messages] || messages.en,
      locale
    });
  }

  /**
   * Send marking job completion notification
   */
  async sendMarkingCompletionSMS(params: {
    phoneNumber: string;
    ownerName: string;
    propertyAddress: string;
    locale: string;
  }) {
    const { phoneNumber, ownerName, propertyAddress, locale } = params;

    const messages = {
      en: `Hi ${ownerName}, marking for your property at ${propertyAddress} is complete. Please review and confirm on Newcondo.`,
      fr: `Bonjour ${ownerName}, le marquage de votre propriété à ${propertyAddress} est terminé. Veuillez examiner et confirmer sur Newcondo.`,
      pcm: `Hello ${ownerName}, marking for your property for ${propertyAddress} don complete. Abeg check am and confirm for Newcondo.`
    };

    return this.sendSMS({
      to: phoneNumber,
      message: messages[locale as keyof typeof messages] || messages.en,
      locale
    });
  }

  /**
   * Send password reset SMS
   */
  async sendPasswordResetSMS(params: {
    phoneNumber: string;
    resetCode: string;
    locale: string;
  }) {
    const { phoneNumber, resetCode, locale } = params;

    const messages = {
      en: `Your Newcondo password reset code is: ${resetCode}. Valid for 10 minutes. Don't share this code.`,
      fr: `Votre code de réinitialisation Newcondo est: ${resetCode}. Valide pendant 10 minutes. Ne partagez pas ce code.`,
      pcm: `Your Newcondo password reset code na: ${resetCode}. E go work for 10 minutes. No share this code.`
    };

    return this.sendSMS({
      to: phoneNumber,
      message: messages[locale as keyof typeof messages] || messages.en,
      locale
    });
  }

  /**
   * Core SMS sending method
   */
  private async sendSMS(params: SMSParams) {
    try {
      // Format phone number (ensure it includes country code)
      let phoneNumber = params.to;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+234' + phoneNumber.replace(/^0+/, ''); // Nigeria
      }

      // Using Termii API
      const response = await axios.post(
        `${this.baseUrl}/sms/send`,
        {
          to: phoneNumber,
          from: this.senderId,
          sms: params.message,
          type: 'plain',
          channel: 'generic',
          api_key: this.apiKey
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`SMS sent to ${phoneNumber}: ${response.data.message_id}`);

      return {
        success: true,
        messageId: response.data.message_id
      };
    } catch (error: any) {
      console.error('SMS sending failed:', error.response?.data || error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(messages: SMSParams[]) {
    const results = await Promise.allSettled(
      messages.map(msg => this.sendSMS(msg))
    );

    return {
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      total: results.length
    };
  }

  /**
   * Check SMS balance
   */
  async checkBalance() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/get-balance?api_key=${this.apiKey}`
      );

      return {
        balance: response.data.balance,
        currency: response.data.currency
      };
    } catch (error: any) {
      console.error('Failed to check SMS balance:', error);
      throw new Error('Failed to check SMS balance');
    }
  }
}

export const smsService = new SMSService();