import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLanguageSwitcher } from '@/hooks/useI18n';
import { changeLanguage } from '@/lib/i18n/client';

// Mock the i18n functions
vi.mock('@/lib/i18n/client', () => ({
  changeLanguage: vi.fn(),
  getCurrentLanguage: vi.fn(() => 'en'),
  getLanguageDirection: vi.fn(() => 'ltr'),
}));

vi.mock('@/lib/i18n/translations', () => ({
  languages: ['en', 'fr', 'pcm'],
  fallbackLng: 'en',
  languageMetadata: {
    en: {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
      direction: 'ltr',
    },
    fr: {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      direction: 'ltr',
    },
    pcm: {
      code: 'pcm',
      name: 'Nigerian Pidgin',
      nativeName: 'Naija Pidgin',
      flag: '🇳🇬',
      direction: 'ltr',
    },
  },
}));

// Test component using the hook
function LanguageSwitcher() {
  const { currentLanguage, switchLanguage, availableLanguages } = useLanguageSwitcher();
  
  return (
    <div>
      <div data-testid="current-language">{currentLanguage}</div>
      <div>
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            data-testid={`lang-${lang.code}`}
            onClick={() => switchLanguage(lang.code as any)}
          >
            {lang.flag} {lang.nativeName}
          </button>
        ))}
      </div>
    </div>
  );
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });
  
  it('should render all available languages', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByTestId('lang-en')).toBeInTheDocument();
    expect(screen.getByTestId('lang-fr')).toBeInTheDocument();
    expect(screen.getByTestId('lang-pcm')).toBeInTheDocument();
  });
  
  it('should display current language', () => {
    render(<LanguageSwitcher />);
    
    const currentLang = screen.getByTestId('current-language');
    expect(currentLang).toHaveTextContent('en');
  });
  
  it('should call changeLanguage when switching language', async () => {
    render(<LanguageSwitcher />);
    
    const frenchButton = screen.getByTestId('lang-fr');
    fireEvent.click(frenchButton);
    
    await waitFor(() => {
      expect(changeLanguage).toHaveBeenCalledWith('fr');
    });
  });
  
  it('should reload page after language switch', async () => {
    render(<LanguageSwitcher />);
    
    const pidginButton = screen.getByTestId('lang-pcm');
    fireEvent.click(pidginButton);
    
    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled();
    });
  });
  
  it('should display language flags', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByText(/🇬🇧/)).toBeInTheDocument();
    expect(screen.getByText(/🇫🇷/)).toBeInTheDocument();
    expect(screen.getByText(/🇳🇬/)).toBeInTheDocument();
  });
  
  it('should display native language names', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByText(/English/)).toBeInTheDocument();
    expect(screen.getByText(/Français/)).toBeInTheDocument();
    expect(screen.getByText(/Naija Pidgin/)).toBeInTheDocument();
  });
});

describe('useLanguageSwitcher hook', () => {
  it('should return current language', () => {
    const { result } = renderHook(() => useLanguageSwitcher());
    
    expect(result.current.currentLanguage).toBe('en');
  });
  
  it('should return available languages', () => {
    const { result } = renderHook(() => useLanguageSwitcher());
    
    expect(result.current.availableLanguages).toHaveLength(3);
    expect(result.current.availableLanguages[0]).toHaveProperty('code', 'en');
    expect(result.current.availableLanguages[1]).toHaveProperty('code', 'fr');
    expect(result.current.availableLanguages[2]).toHaveProperty('code', 'pcm');
  });
  
  it('should provide switchLanguage function', () => {
    const { result } = renderHook(() => useLanguageSwitcher());
    
    expect(typeof result.current.switchLanguage).toBe('function');
  });
});

// Helper for renderHook
function renderHook<T>(callback: () => T) {
  let result: { current: T } = { current: undefined as any };
  
  function TestComponent() {
    result.current = callback();
    return null;
  }
  
  render(<TestComponent />);
  
  return { result };
}