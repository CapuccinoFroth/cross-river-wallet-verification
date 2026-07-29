import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { headers } from "next/headers"
import { AppKitProvider } from "@/context/appkit-provider"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Cross River — WalletConnect Compliance on Flows",
  description:
    "Concept demo: connect and verify an external wallet, fund a Cross River balance, or withdraw to a verified beneficiary wallet with compliance built into the flow.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers()
  const cookies = headersObj.get("cookie")

  return (
    <html lang="en" className={`light ${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-background font-sans antialiased">
        <AppKitProvider cookies={cookies}>{children}</AppKitProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
