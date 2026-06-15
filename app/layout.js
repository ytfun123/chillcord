export const metadata = {
  title: "Username Texting App",
  description: "Real-time chat platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
