export const metadata = {
  title: 'LHNY AFIS',
  description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hu">
      <body
        style={{
          minHeight: "100vh",
          margin: "0",
          padding: "20px",
          backgroundImage: `url("/bg.jpg")`,
          backgroundAttachment: "fixed",
          backgroundSize: "cover", // kitölti a képernyőt, megtartva az arányokat
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          boxSizing: "border-box",
          position: "relative",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: "white",
        }}
      >
        {children}
      </body>
    </html>
  )
}
