/**
 * File: backend/marking-service/src/utils/i18n.ts
 * i18n utilities specific to marking service
 */

import { SupportedLocale, MultiLanguageField } from '@newcondo/shared/types/i18n.types';
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '@newcondo/shared/utils/formatting';

/**
 * Marking job status translations
 */
export const getMarkingJobStatusLabel = (
  status: string,
  locale: SupportedLocale = 'en'
): string => {
  const translations: Record<string, MultiLanguageField> = {
    QUEUED: {
      en: 'Queued',
      fr: 'En attente',
      pcm: 'Dey wait',
    },
    ASSIGNED: {
      en: 'Assigned',
      fr: 'Assigné',
      pcm: 'Dem don give person',
    },
    IN_PROGRESS: {
      en: 'In Progress',
      fr: 'En cours',
      pcm: 'Dey do am now',
    },
    COMPLETED: {
      en: 'Completed',
      fr: 'Terminé',
      pcm: 'Don finish',
    },
    CANCELLED: {
      en: 'Cancelled',
      fr: 'Annulé',
      pcm: 'Dem don cancel am',
    },
    EXPIRED: {
      en: 'Expired',
      fr: 'Expiré',
      pcm: 'E don expire',
    },
  };

  return translations[status]?.[locale] || status;
};

/**
 * Urgency level translations
 */
export const getUrgencyLevelLabel = (
  level: string,
  locale: SupportedLocale = 'en'
): string => {
  const translations: Record<string, MultiLanguageField> = {
    LOW: {
      en: 'Low Priority',
      fr: 'Priorité basse',
      pcm: 'E no dey urgent',
    },
    NORMAL: {
      en: 'Normal Priority',
      fr: 'Priorité normale',
      pcm: 'Normal level',
    },
    HIGH: {
      en: 'High Priority',
      fr: 'Priorité haute',
      pcm: 'E dey urgent small',
    },
    URGENT: {
      en: 'Urgent',
      fr: 'Urgent',
      pcm: 'Very urgent',
    },
  };

  return translations[level]?.[locale] || level;
};

/**
 * Format marking fee with currency
 */
export const formatMarkingFee = (
  amount: number,
  locale: SupportedLocale = 'en'
): string => {
  return formatCurrency(amount, 'NGN', locale);
};

/**
 * Format time slot information
 */
export const formatTimeSlot = (
  startTime: Date,
  endTime: Date,
  locale: SupportedLocale = 'en'
): string => {
  const start = formatDateTime(startTime, locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const end = formatDateTime(endTime, locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const labels: Record<SupportedLocale, string> = {
    en: `${start} to ${end}`,
    fr: `${start} à ${end}`,
    pcm: `From ${start} reach ${end}`,
  };

  return labels[locale];
};

/**
 * Get marking job notification message
 */
export const getMarkingJobNotification = (
  type: 'assigned' | 'completed' | 'expired' | 'cancelled',
  jobDetails: {
    propertyTitle: string;
    location: string;
    fee?: number;
    agentName?: string;
  },
  locale: SupportedLocale = 'en'
): string => {
  const { propertyTitle, location, fee, agentName } = jobDetails;

  const notifications: Record<
    string,
    Record<SupportedLocale, (details: typeof jobDetails) => string>
  > = {
    assigned: {
      en: (d) =>
        `New marking job assigned for "${d.propertyTitle}" in ${d.location}. Fee: ${formatMarkingFee(d.fee || 0, 'en')}`,
      fr: (d) =>
        `Nouveau travail de marquage assigné pour "${d.propertyTitle}" à ${d.location}. Frais: ${formatMarkingFee(d.fee || 0, 'fr')}`,
      pcm: (d) =>
        `Dem give you new marking job for "${d.propertyTitle}" for ${d.location}. Money na: ${formatMarkingFee(d.fee || 0, 'pcm')}`,
    },
    completed: {
      en: (d) =>
        `Marking job completed by ${d.agentName} for "${d.propertyTitle}" in ${d.location}`,
      fr: (d) =>
        `Travail de marquage terminé par ${d.agentName} pour "${d.propertyTitle}" à ${d.location}`,
      pcm: (d) =>
        `${d.agentName} don finish mark "${d.propertyTitle}" for ${d.location}`,
    },
    expired: {
      en: (d) =>
        `Marking job expired for "${d.propertyTitle}" in ${d.location}. Time slot has passed.`,
      fr: (d) =>
        `Travail de marquage expiré pour "${d.propertyTitle}" à ${d.location}. Le créneau horaire est passé.`,
      pcm: (d) =>
        `The marking job for "${d.propertyTitle}" for ${d.location} don expire. Time don pass.`,
    },
    cancelled: {
      en: (d) =>
        `Marking job cancelled for "${d.propertyTitle}" in ${d.location}`,
      fr: (d) =>
        `Travail de marquage annulé pour "${d.propertyTitle}" à ${d.location}`,
      pcm: (d) =>
        `Dem don cancel the marking job for "${d.propertyTitle}" for ${d.location}`,
    },
  };

  return notifications[type][locale](jobDetails);
};

/**
 * Get queue position message
 */
export const getQueuePositionMessage = (
  position: number,
  totalInQueue: number,
  locale: SupportedLocale = 'en'
): string => {
  const messages: Record<SupportedLocale, string> = {
    en: `You are position ${position} of ${totalInQueue} in the queue`,
    fr: `Vous êtes à la position ${position} sur ${totalInQueue} dans la file d'attente`,
    pcm: `You dey position ${position} for line wey get ${totalInQueue} people`,
  };

  return messages[locale];
};

/**
 * Get time remaining message
 */
export const getTimeRemainingMessage = (
  expiryTime: Date,
  locale: SupportedLocale = 'en'
): string => {
  const now = new Date();
  const remainingMs = expiryTime.getTime() - now.getTime();
  const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
  const remainingHours = Math.floor(remainingMinutes / 60);

  if (remainingMinutes <= 0) {
    const expired: Record<SupportedLocale, string> = {
      en: 'Time slot expired',
      fr: 'Créneau horaire expiré',
      pcm: 'Time don pass',
    };
    return expired[locale];
  }

  if (remainingHours > 0) {
    const messages: Record<SupportedLocale, string> = {
      en: `${remainingHours} hour${remainingHours > 1 ? 's' : ''} remaining`,
      fr: `${remainingHours} heure${remainingHours > 1 ? 's' : ''} restante${remainingHours > 1 ? 's' : ''}`,
      pcm: `${remainingHours} hour${remainingHours > 1 ? 's' : ''} still dey`,
    };
    return messages[locale];
  }

  const messages: Record<SupportedLocale, string> = {
    en: `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} remaining`,
    fr: `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} restante${remainingMinutes > 1 ? 's' : ''}`,
    pcm: `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} still dey`,
  };

  return messages[locale];
};

/**
 * Get completion confirmation message
 */
export const getCompletionConfirmationMessage = (
  daysRemaining: number,
  locale: SupportedLocale = 'en'
): string => {
  const messages: Record<SupportedLocale, string> = {
    en: `Please confirm marking completion within ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
    fr: `Veuillez confirmer l'achèvement du marquage dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
    pcm: `Abeg confirm say dem don mark the house inside ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
  };

  return messages[locale];
};

/**
 * Get agent earnings message
 */
export const getAgentEarningsMessage = (
  amount: number,
  isPartial: boolean,
  locale: SupportedLocale = 'en'
): string => {
  const formattedAmount = formatMarkingFee(amount, locale);

  if (isPartial) {
    const messages: Record<SupportedLocale, string> = {
      en: `Partial payment of ${formattedAmount} credited. Full payment upon owner confirmation.`,
      fr: `Paiement partiel de ${formattedAmount} crédité. Paiement complet après confirmation du propriétaire.`,
      pcm: `Dem don pay you small money ${formattedAmount}. You go collect the rest when owner confirm.`,
    };
    return messages[locale];
  }

  const messages: Record<SupportedLocale, string> = {
    en: `Full payment of ${formattedAmount} credited to your account`,
    fr: `Paiement complet de ${formattedAmount} crédité sur votre compte`,
    pcm: `Dem don pay you full money ${formattedAmount} for your account`,
  };

  return messages[locale];
};

/**
 * Get marking instructions message
 */
export const getMarkingInstructions = (
  locale: SupportedLocale = 'en'
): string[] => {
  const instructions: Record<SupportedLocale, string[]> = {
    en: [
      'Go to the property location',
      'Contact the person provided for access',
      'Take clear photos of key areas and rooms',
      'Mark the property boundaries on the map',
      'Upload all photos and complete the marking',
    ],
    fr: [
      'Allez à l\'emplacement de la propriété',
      'Contactez la personne fournie pour l\'accès',
      'Prenez des photos claires des zones clés et des pièces',
      'Marquez les limites de la propriété sur la carte',
      'Téléchargez toutes les photos et complétez le marquage',
    ],
    pcm: [
      'Go the place wey the house dey',
      'Call the person wey go show you the house',
      'Snap clear pictures of important places for inside',
      'Mark where the house boundary dey for map',
      'Upload all the pictures make you finish the marking',
    ],
  };

  return instructions[locale];
};

/**
 * Get error messages for marking service
 */
export const getMarkingErrorMessage = (
  errorCode: string,
  locale: SupportedLocale = 'en'
): string => {
  const errors: Record<string, MultiLanguageField> = {
    JOB_NOT_FOUND: {
      en: 'Marking job not found',
      fr: 'Travail de marquage introuvable',
      pcm: 'We no see that marking job',
    },
    TIME_SLOT_EXPIRED: {
      en: 'Your time slot has expired',
      fr: 'Votre créneau horaire a expiré',
      pcm: 'Your time don pass',
    },
    ALREADY_ASSIGNED: {
      en: 'This job has already been assigned to another agent',
      fr: 'Ce travail a déjà été assigné à un autre agent',
      pcm: 'Dem don give this job to another person',
    },
    NOT_IN_SERVICE_AREA: {
      en: 'This property is outside your service area',
      fr: 'Cette propriété est en dehors de votre zone de service',
      pcm: 'This house no dey your area',
    },
    INSUFFICIENT_PAYMENT: {
      en: 'Payment not completed for this marking job',
      fr: 'Paiement non complété pour ce travail de marquage',
      pcm: 'Dem never pay complete for this marking job',
    },
    INVALID_COMPLETION_DATA: {
      en: 'Invalid completion data provided',
      fr: 'Données d\'achèvement invalides fournies',
      pcm: 'The information wey you put no correct',
    },
    QUEUE_FULL: {
      en: 'Queue is currently full. Please try again later.',
      fr: 'La file d\'attente est actuellement pleine. Veuillez réessayer plus tard.',
      pcm: 'Line don full. Abeg try again later.',
    },
  };

  return errors[errorCode]?.[locale] || errorCode;
};

/**
 * Get success messages for marking service
 */
export const getMarkingSuccessMessage = (
  action: string,
  locale: SupportedLocale = 'en'
): string => {
  const messages: Record<string, MultiLanguageField> = {
    JOB_CREATED: {
      en: 'Marking job created successfully',
      fr: 'Travail de marquage créé avec succès',
      pcm: 'Dem don create the marking job',
    },
    JOB_ACCEPTED: {
      en: 'Marking job accepted. Please complete within the time slot.',
      fr: 'Travail de marquage accepté. Veuillez terminer dans le créneau horaire.',
      pcm: 'You don accept the job. Make sure say you finish am for time.',
    },
    JOB_COMPLETED: {
      en: 'Marking job completed successfully',
      fr: 'Travail de marquage terminé avec succès',
      pcm: 'You don finish the marking job',
    },
    PAYMENT_RECEIVED: {
      en: 'Payment received and credited to your account',
      fr: 'Paiement reçu et crédité sur votre compte',
      pcm: 'Money don enter your account',
    },
    CONFIRMATION_RECEIVED: {
      en: 'Marking confirmed by property owner',
      fr: 'Marquage confirmé par le propriétaire',
      pcm: 'Property owner don confirm the marking',
    },
  };

  return messages[action]?.[locale] || action;
};