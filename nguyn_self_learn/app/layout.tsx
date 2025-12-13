export const metadata = {
  title: 'Resume Extractor',
  description: 'Extract skills and projects from PDF resume',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

