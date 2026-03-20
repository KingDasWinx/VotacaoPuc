import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Eleição Líder de Turma — PUCPR',
  description: 'Vote no seu representante de turma',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-puc-bg font-montserrat">
        <div className="max-w-mobile mx-auto min-h-screen bg-white shadow-lg">
          {children}
        </div>
      </body>
    </html>
  )
}
