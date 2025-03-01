'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { ChevronDown, Languages } from 'lucide-react';

// Define supported languages
export interface Language {
  code: string;
  name: string;
}

// Create a context for language settings
interface LanguageContextType {
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  sourceLanguage: 'en',
  targetLanguage: '',
  setSourceLanguage: () => {},
  setTargetLanguage: () => {}
});

// Provider component to wrap your app
export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [sourceLanguage, setSourceLanguageRaw] = useState('en');
  const [targetLanguage, setTargetLanguageRaw] = useState('');

  // Enhanced setters that enforce valid translation pairs
  const setSourceLanguage = (lang: string) => {
    setSourceLanguageRaw(lang);
    
    // If changing to English, target can be any language (current remains valid)
    // If changing from English to another language, target must be English or none
    if (lang !== 'en' && targetLanguage !== '' && targetLanguage !== 'en') {
      setTargetLanguageRaw('en'); // Auto-switch to English
    }
  };

  const setTargetLanguage = (lang: string) => {
    // Validate the language pair
    if (sourceLanguage === 'en' || lang === '' || lang === 'en') {
      setTargetLanguageRaw(lang);
    } else {
      console.warn('Invalid translation pair. When source is not English, target can only be English or none.');
    }
  };

  // Load initial values from localStorage
  useEffect(() => {
    const savedSourceLang = localStorage.getItem('sourceLanguage');
    const savedTargetLang = localStorage.getItem('targetLanguage');
    
    if (savedSourceLang) setSourceLanguageRaw(savedSourceLang);
    
    // Validate the loaded pair
    if (savedTargetLang) {
      if (savedSourceLang === 'en' || savedTargetLang === '' || savedTargetLang === 'en') {
        setTargetLanguageRaw(savedTargetLang);
      } else {
        // Invalid pair from localStorage, reset target to English
        setTargetLanguageRaw('en');
      }
    }
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    localStorage.setItem('sourceLanguage', sourceLanguage);
  }, [sourceLanguage]);

  useEffect(() => {
    if (targetLanguage !== undefined) {
      localStorage.setItem('targetLanguage', targetLanguage);
    }
  }, [targetLanguage]);

  return (
    <LanguageContext.Provider value={{
      sourceLanguage,
      targetLanguage,
      setSourceLanguage,
      setTargetLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Full list of languages supported by Speechmatics for transcription
export const SOURCE_LANGUAGES: Language[] = [
  { code: 'ar', name: 'Arabic' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'cmn', name: 'Mandarin Chinese' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'gl', name: 'Galician' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hr', name: 'Croatian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'ms', name: 'Malay' },
  { code: 'nl', name: 'Dutch' },
  { code: 'no', name: 'Norwegian' },
  { code: 'nn', name: 'Norwegian Nynorsk' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' }
];

// Languages supported for translation
export const TARGET_LANGUAGES: Language[] = [
  { code: '', name: 'No Translation' },
  { code: 'en', name: 'English' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'cmn', name: 'Mandarin Chinese' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'es', name: 'Spanish' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'gl', name: 'Galician' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hr', name: 'Croatian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'ms', name: 'Malay' },
  { code: 'nl', name: 'Dutch' },
  { code: 'no', name: 'Norwegian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' }
];

// Helper function to get language name from code
export const getLanguageName = (code: string): string => {
  const language = [...SOURCE_LANGUAGES, ...TARGET_LANGUAGES].find((lang) => lang.code === code);
  return language ? language.name : code;
};

interface LanguageSelectorProps {
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  inSidebar?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  disabled = false, 
  className = '',
  compact = false,
  inSidebar = false
}) => {
  // Use the context instead of local state
  const { sourceLanguage, targetLanguage, setSourceLanguage, setTargetLanguage } = useContext(LanguageContext);
  
  // Get available target languages based on source language
  const getAvailableTargetLanguages = () => {
    // Always include "No Translation" option
    const noTranslation = [TARGET_LANGUAGES[0]];
    
    if (sourceLanguage === 'en') {
      // If source is English, allow translation to any other language
      return [...noTranslation, ...TARGET_LANGUAGES.filter(lang => lang.code !== '' && lang.code !== 'en')];
    } else {
      // If source is not English, only allow English as target
      return [...noTranslation, TARGET_LANGUAGES.find(lang => lang.code === 'en')!];
    }
  };

  // Update the select className to have more rounded corners
  const selectClassName = "w-full text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 border border-neutral-300 appearance-none pl-2 pr-6 py-1";

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <div className="relative w-full">
        <select
          id="source-language-select"
          value={sourceLanguage}
          onChange={(e) => setSourceLanguage(e.target.value)}
          disabled={disabled}
          className={selectClassName}
        >
          {SOURCE_LANGUAGES.map((lang) => (
            <option key={`source-${lang.code}`} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
          <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Center arrow with translation icon */}
      <div className="flex justify-center items-center py-0.5 text-neutral-500">
        <Languages className="h-3 w-3 mr-0.5" />
        <ChevronDown className="h-4 w-4" />
      </div>
      
      <div className="relative w-full">
        <select
          id="target-language-select"
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          disabled={disabled}
          className={selectClassName}
        >
          {getAvailableTargetLanguages().map((lang) => (
            <option key={`target-${lang.code}`} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
          <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// This hook allows other components to access the current language settings
export const useLanguageSettings = () => {
  return useContext(LanguageContext);
};
