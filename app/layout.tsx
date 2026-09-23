import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'NOVELYS — Mémoire client',description:'Votre mémoire client : les bons contacts, le contexte et la prochaine action.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
