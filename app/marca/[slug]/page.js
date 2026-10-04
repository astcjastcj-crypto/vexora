import Link from "next/link";

const brands = {
  chatgpt: {
    name: "ChatGPT",
    type: "Inteligencia Artificial",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/ChatGPT-Logo.svg",
    plans: [
      { name: "Cuenta Compartida", duration: "1 mes", price: "S/19", note: "Acceso compartido" },
      { name: "Cuenta Completa", duration: "1 mes", price: "S/40", note: "Sin garantía" },
      { name: "Cuenta Completa", duration: "1 mes", price: "S/65", note: "Con garantía todo el mes" },
      { name: "GPT Pro", duration: "1 mes", price: "S/80", note: "Cuenta compartida" }
    ]
  },
  gemini: {
    name: "Gemini",
    type: "Inteligencia Artificial",
    logo: "https://cdn.simpleicons.org/googlegemini",
    plans: []
  },
  spotify: {
    name: "Spotify",
    type: "Streaming",
    logo: "https://cdn.simpleicons.org/spotify",
    plans: []
  },
  "canva-pro": {
    name: "Canva Pro",
    type: "Diseño",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Canva_logo.svg",
    plans: []
  },
  "geforce-now": {
    name: "GeForce NOW",
    type: "Gaming",
    logo: "https://cdn.simpleicons.org/nvidia",
    plans: []
  }
};

export default async function BrandPage({ params }) {
  const { slug } = await params;
  const brand = brands[slug] || brands.chatgpt;

  return (
    <main className="brand-page">
      <div className="brand-page-glow brand-page-glow-one" />
      <div className="brand-page-glow brand-page-glow-two" />

      <header className="brand-page-topbar">
        <Link href="/" className="back-button">← Volver</Link>
        <span className="brand-page-title">VEXORA</span>
        <span className="brand-page-status">ACCESO DIGITAL</span>
      </header>

      <section className="brand-hero">
        <div className="brand-hero-logo">
          <span className="brand-orbit orbit-a" />
          <span className="brand-orbit orbit-b" />
          <img src={brand.logo} alt={brand.name + " logo"} />
        </div>
        <div className="brand-hero-copy">
          <span>{brand.type}</span>
          <h1>{brand.name}</h1>
          <p>Elige el acceso que mejor se adapte a ti.</p>
        </div>
      </section>

      <section className="plans-section">
        <div className="plans-heading">
          <span>PLANES DISPONIBLES</span>
          <h2>Elige tu acceso</h2>
          <p>Selecciona un plan y luego coordinamos tu compra directamente con VEXORA.</p>
        </div>

        {brand.plans.length ? (
          <div className="plans-grid">
            {brand.plans.map((plan, index) => (
              <article className={"plan-card " + (index === 2 ? "featured" : "")} key={plan.name + plan.price}>
                {index === 2 && <div className="plan-badge">MÁS ELEGIDO</div>}
                <div className="plan-number">0{index + 1}</div>
                <h3>{plan.name}</h3>
                <span className="plan-duration">{plan.duration}</span>
                <strong>{plan.price}</strong>
                <p>{plan.note}</p>
                <button>Elegir plan <span>↗</span></button>
              </article>
            ))}
          </div>
        ) : (
          <div className="plans-empty">
            <span>PRÓXIMAMENTE</span>
            <h3>Estamos preparando los planes de {brand.name}.</h3>
            <p>Vuelve pronto para ver los accesos disponibles.</p>
          </div>
        )}
      </section>

      <footer className="brand-page-footer">
        <Link href="/">VEXORA — Tu acceso a lo digital.</Link>
      </footer>
    </main>
  );
}
