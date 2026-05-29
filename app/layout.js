import './globals.css'

export const metadata = {
  title: 'FocusTube',
  description: 'Learn from YouTube videos distraction free.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
