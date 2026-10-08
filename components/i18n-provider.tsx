'use client';
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import {useAuth} from '@/components/auth-provider';
import {formatDisplayDate,isLanguage,languagePreferenceKey,locales,translate,type Language,type Translate} from '@/lib/i18n';
type I18nValue={language:Language;locale:string;t:Translate;formatDate:(value:string)=>string;setLanguage:(language:Language)=>void};
const fallback:I18nValue={language:'en',locale:locales.en,formatDate:value=>formatDisplayDate(value,'en'),t:(key,values)=>translate('en',key,values),setLanguage:()=>{}};
const Context=createContext<I18nValue>(fallback);
export function I18nProvider({children}:{children:React.ReactNode}){
 const {user,loading}=useAuth();const userId=user?.id??null;
 const [preference,setPreference]=useState<{owner:string|null;language:Language}>({owner:null,language:'en'});
 const language=preference.owner===userId?preference.language:'en';
 useEffect(()=>{if(loading)return;let saved:unknown;try{saved=localStorage.getItem(languagePreferenceKey(userId));}catch{}setPreference({owner:userId,language:isLanguage(saved)?saved:'en'});},[userId,loading]);
 useEffect(()=>{document.documentElement.lang=language;},[language]);
 const setLanguage=useCallback((next:Language)=>{setPreference({owner:userId,language:next});try{localStorage.setItem(languagePreferenceKey(userId),next);}catch{}},[userId]);
 const t=useCallback<Translate>((key,values)=>translate(language,key,values),[language]);
 const value=useMemo(()=>({language,locale:locales[language],setLanguage,t,formatDate:(value:string)=>formatDisplayDate(value,language)}),[language,setLanguage,t]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n(){return useContext(Context);}
export function LanguageSelector(){const {language,setLanguage,t}=useI18n();return <label className="language-selector"><span className="sr-only">{t('Language')}</span><select aria-label={t('Language')} value={language} onChange={e=>{if(isLanguage(e.target.value))setLanguage(e.target.value);}}><option value="en">🇬🇧 English</option><option value="tr">🇹🇷 Türkçe</option><option value="nl">🇳🇱 Nederlands</option><option value="de">🇩🇪 Deutsch</option></select></label>;}
