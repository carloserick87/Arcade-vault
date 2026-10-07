import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "404" };

export default function NotFound() {
  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">404</h1>
        <div className="sub">
          CARTUCHO NO ENCONTRADO <span className="blink">_</span>
        </div>
        <p style={{ color: "var(--ink-dim)", margin: "24px auto 32px", maxWidth: 480 }}>
          Este juego no está en el vault. Revisa la dirección o vuelve a la biblioteca.
        </p>
        <Link href="/" className="btn lg">
          VOLVER AL VAULT
        </Link>
      </section>
    </div>
  );
}
