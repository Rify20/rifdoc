export const metadata = {
  title: 'RifDoc - PDF Tools ',
  description: 'Gabungkan PDF dengan mudah dan cepat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
