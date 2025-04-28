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
          backgroundImage: `url("https://img.freepik.com/free-photo/abstract-gradient-background-with-grainy-effect_84443-3113.jpg?t=st=1744361142~exp=1744364742~hmac=97756c5c6e5461008f9952f15c9da5c3fdfc02fa00b617fc43f3ea7ac4bd04d1&w=1380")`,
          backgroundSize: "cover",
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
