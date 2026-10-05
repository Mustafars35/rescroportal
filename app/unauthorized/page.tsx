import Link from "next/link";
export default function UnauthorizedPage(){return <main className="auth-screen"><section className="auth-card"><span className="auth-kicker">ACCESS DENIED</span><h1>You do not have access to this page.</h1><p>Ask an administrator to update your permissions.</p><Link href="/" className="auth-home-link">Back to portal</Link></section></main>;}
