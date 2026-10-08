"use client";
import {useI18n,LanguageSelector} from "@/components/i18n-provider";
import Link from "next/link";
export default function UnauthorizedPage(){ const {t,locale} = useI18n(); return <main className="auth-screen"><div className="auth-language-tools"><LanguageSelector/></div><section className="auth-card"><span className="auth-kicker">{t("ACCESS DENIED")}</span><h1>{t("You do not have access to this page.")}</h1><p>{t("Ask an administrator to update your permissions.")}</p><Link href="/" className="auth-home-link">{t("Back to portal")}</Link></section></main>;}
