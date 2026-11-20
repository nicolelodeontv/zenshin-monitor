import './globals.css';
import type { ReactNode } from 'react';
export const metadata={title:'Zenshin Monitor',description:'Read-only clan progress monitor'};
export default function Layout({children}:{children:ReactNode}) {return <html lang="en"><body>{children}</body></html>}
