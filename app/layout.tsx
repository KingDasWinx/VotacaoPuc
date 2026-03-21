import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Eleição Líder de Turma — PUCPR',
  description: 'Vote no seu representante de turma',
  icons: { icon: '/image.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-puc-bg font-montserrat">
        {children}
      </body>
    </html>
  )
}
