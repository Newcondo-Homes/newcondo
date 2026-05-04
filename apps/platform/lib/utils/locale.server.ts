import { cookies } from 'next/headers';
import { languages, fallbackLng, type Language } from '../i18n/translations';

export async function getUserLocale(): Promise<Language> {
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('i18next');
    if (localeCookie?.value && languages.includes(localeCookie.value as Language)) {
      return localeCookie.value as Language;
    }
  } catch (error) {
    console.error('Error reading locale cookie:', error);
  }
  return fallbackLng;
}

export async function setUserLocale(locale: Language): Promise<void> {
  if (!languages.includes(locale)) {
    locale = fallbackLng;
  }
  try {
    const cookieStore = await cookies();
    cookieStore.set('i18next', locale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  } catch (error) {
    console.error('Error setting locale cookie:', error);
  }
}