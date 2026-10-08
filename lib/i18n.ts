import en from '@/locales/en.json';
import tr from '@/locales/tr.json';
import nl from '@/locales/nl.json';
import de from '@/locales/de.json';
export const languages = ['en', 'tr', 'nl', 'de'] as const;
export type Language = typeof languages[number];
export const locales: Record<Language, string> = {en:'en-GB',tr:'tr-TR',nl:'nl-NL',de:'de-DE'};
const dictionaries: Record<Language, Record<string,string>> = {en,tr,nl,de};
export type Translate = (key: string | undefined | null, values?: Record<string,string|number>) => string;
export function isLanguage(value: unknown): value is Language {return languages.includes(value as Language);}
export function translate(language: Language, raw: string | undefined | null, values?: Record<string,string|number>): string {
  if(raw==null)return "";
  const key=raw.trim();
  const prefix=/^(?:FORBIDDEN|CONFLICT|VALIDATION):\s*/.exec(key);
  if(prefix)return translate(language,key.slice(prefix[0].length),values);
  let text=dictionaries[language][key]??dictionaries.en[key];
  if(text===undefined){
    for(const pattern of ['{0} gün kaldı','Sipariş {0} gün gecikti']){
      const pieces=pattern.split('{0}');
      if(key.startsWith(pieces[0])&&key.endsWith(pieces[1])){
        const number=key.slice(pieces[0].length,key.length-pieces[1].length);
        if(/^\d+$/.test(number))return translate(language,pattern,{'0':number});
      }
    }
    // Free text is never sent to a translator or modified.
    return values?raw.replace(/\{([^}]+)\}/g,(token,name)=>values[name]===undefined?token:String(values[name])):raw;
  }
  text=text.replace(/\{([^}]+)\}/g,(token,name)=>values?.[name]===undefined?token:String(values[name]));
  return (raw.match(/^\s*/)?.[0]??'')+text+(raw.match(/\s*$/)?.[0]??'');
}
export function languagePreferenceKey(userId: string | null): string {return `rescro:language:v1:${userId??'guest'}`;}

export function formatDisplayDate(value: string, language: Language): string {
 const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
 const date=match?new Date(Date.UTC(+match[3],+match[2]-1,+match[1],12)):new Date(value.length===10?`${value}T12:00:00Z`:value);
 return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat(locales[language],{timeZone:'Europe/Istanbul',day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
}
