import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Simpósio de Audiologia e Otoneurologia do Oeste do Paraná',
  description: 'Inscrições para o 1º Simpósio de Audiologia e Otoneurologia — Cascavel/PR, 20 e 21 de novembro de 2026.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas font-montserrat text-ink antialiased">
        {children}
      </body>
    </html>
  )
}
