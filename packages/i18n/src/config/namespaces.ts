/**
 * Translation Namespaces
 * 
 * Organizes translations into logical groups for better maintainability
 * and code splitting
 */

/**
 * Available translation namespaces
 */
export const NAMESPACES = [
  'common',        // General UI text (buttons, labels, common phrases)
  'auth',          // Authentication-related text (login, register, verify)
  'property',      // Property listing text (titles, descriptions, filters)
  'payment',       // Payment and transaction text
  'profile',       // User profile and settings text
  'admin',         // Admin dashboard text
  'errors',        // Error messages and validation text
  'marking',       // Property marking service text
  'legal',         // Terms, conditions, and legal text
  'referral',      // Referral system text
  'notification',  // Notification messages
  'email',         // Email templates text
  'validation',    // Form validation messages
  'dashboard',     // Dashboard-specific text
  'search',        // Search and filter text
] as const;

/**
 * Type-safe namespace type
 */
export type Namespace = typeof NAMESPACES[number];

/**
 * Namespace descriptions for documentation
 */
export const NAMESPACE_DESCRIPTIONS: Record<Namespace, string> = {
  common: 'General UI elements, buttons, labels, and common phrases used throughout the application',
  auth: 'Login, registration, OTP verification, password reset, and authentication flows',
  property: 'Property listings, details, creation, editing, filters, and property-related actions',
  payment: 'Payment forms, transaction history, virtual accounts, and payment-related messages',
  profile: 'User profiles, settings, preferences, and account management',
  admin: 'Admin dashboard, user management, approvals, and administrative functions',
  errors: 'Error messages, validation errors, and error states',
  marking: 'Property marking service, agent assignment, job management, and completion',
  legal: 'Terms of service, privacy policy, disclaimers, and legal agreements',
  referral: 'Referral program, invite links, rewards, and referral tracking',
  notification: 'In-app notifications, alerts, and notification preferences',
  email: 'Email template content and email-specific messages',
  validation: 'Form field validation messages and input requirements',
  dashboard: 'Dashboard widgets, statistics, and dashboard-specific content',
  search: 'Search functionality, filters, sorting, and search results',
};

/**
 * Default namespaces to load on app initialization
 * These are loaded eagerly for better UX
 */
export const DEFAULT_NAMESPACES: Namespace[] = [
  'common',
  'errors',
  'validation',
];

/**
 * Lazy-loaded namespaces
 * These are loaded on-demand when needed
 */
export const LAZY_NAMESPACES: Namespace[] = NAMESPACES.filter(
  ns => !DEFAULT_NAMESPACES.includes(ns)
);

/**
 * Namespace dependencies
 * Defines which namespaces should be loaded together
 */
export const NAMESPACE_DEPENDENCIES: Partial<Record<Namespace, Namespace[]>> = {
  auth: ['validation', 'errors'],
  property: ['validation', 'errors', 'search'],
  payment: ['validation', 'errors'],
  profile: ['validation', 'errors'],
  marking: ['validation', 'errors', 'payment'],
  admin: ['validation', 'errors', 'property', 'payment'],
};

/**
 * Get all namespaces that should be loaded for a given namespace
 * Includes the namespace itself and its dependencies
 */
export const getNamespaceWithDependencies = (namespace: Namespace): Namespace[] => {
  const deps = NAMESPACE_DEPENDENCIES[namespace] || [];
  return [namespace, ...deps];
};

/**
 * Check if a namespace is valid
 */
export const isValidNamespace = (namespace: string): namespace is Namespace => {
  return NAMESPACES.includes(namespace as Namespace);
};

/**
 * Get namespace description
 */
export const getNamespaceDescription = (namespace: Namespace): string => {
  return NAMESPACE_DESCRIPTIONS[namespace] || 'No description available';
};