export const metadata = {
  title: "CarCustomsAI",
  description: "AI car customization – quick & precise"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, Inter, sans-serif", margin:0, padding:0, background:"#0b0d10", color:"#e7eaee" }}>
        <div style={{ maxWidth: 960, margin:"0 auto", padding:24 }}>
          <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <h1 style={{ margin:0, fontSize:24 }}>CarCustomsAI</h1>
            <a href="https://replicate.com" target="_blank" rel="noreferrer" style={{ color:"#93c5fd", textDecoration:"none" }}>
              Powered by Replicate
            </a>
          </header>
          {children}
          <footer style={{ marginTop:48, opacity:0.7, fontSize:12 }}>© {new Date().getFullYear()} CarCustomsAI – MVP</footer>
        </div>
      </body>
    </html>
  );
}
