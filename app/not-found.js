import Link from "next/link";

export default function NotFound() {
  return (
    <main className="vexora-system-page">
      <div className="vexora-system-orb">V</div>
      <span>VEXORA · 404</span>
      <h1>Esta página no existe.</h1>
      <p>El acceso que buscas no está disponible o la dirección ya no existe.</p>
      <Link href="/">Volver a VEXORA</Link>
    </main>
  );
}
