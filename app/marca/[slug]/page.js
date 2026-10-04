"use client";

import Link from "next/link";
import { useState } from "react";

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

export default function BrandPage({ params }) {
  const { slug } = params;
  const brand = brands[slug] || brands.chatgpt;
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
                <button onClick={() => { setSelectedPlan(plan); setTermsAccepted(false); }}>Elegir plan <span>↗</span></button>
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

      {selectedPlan && (
        <div className="purchase-overlay" role="dialog" aria-modal="true" aria-label={"Información de " + selectedPlan.name}>
          <div className="purchase-modal">
            <button className="purchase-close" onClick={() => setSelectedPlan(null)} aria-label="Cerrar">×</button>
            <div className="purchase-modal-head">
              <div className="purchase-modal-logo"><img src={brand.logo} alt="" /></div>
              <div><span>{brand.name} · {selectedPlan.duration}</span><h2>{selectedPlan.name}</h2><strong>{selectedPlan.price}</strong></div>
            </div>
            <div className="purchase-info">
              <span className="purchase-kicker">ANTES DE CONTINUAR</span>
              <h3>Información importante del acceso</h3>
              <p>Este acceso se entrega con las condiciones indicadas a continuación. Léelas con atención antes de solicitar tu compra.</p>
              <div className="purchase-rules">
                <div><b>01</b><span><strong>Acceso y dispositivo</strong>El plan compartido está destinado a <em>1 dispositivo por cliente</em>. Recibirás el correo y la contraseña para ingresar.</span></div>
                <div><b>02</b><span><strong>Código de acceso</strong>Al iniciar sesión, el servicio puede solicitar un código de verificación. <em>El código será proporcionado por el administrador de VEXORA</em> cuando corresponda.</span></div>
                <div><b>03</b><span><strong>Uso responsable</strong>El acceso se entrega mediante un método de activación gestionado por VEXORA. No cambies el correo, contraseña, método de acceso ni la configuración de la cuenta.</span></div>
                <div><b>04</b><span><strong>Proyectos y archivos</strong>Si utilizas proyectos, conversaciones o archivos importantes, mantén siempre una copia propia. En cuentas compartidas existen limitaciones de uso y disponibilidad.</span></div>
                <div><b>05</b><span><strong>Imágenes y archivos</strong>Las funciones de generación de imágenes, subida de archivos y otras herramientas pueden estar sujetas a <em>límites de uso</em> debido a que el acceso es compartido. Estos límites no representan un fallo del servicio.</span></div>
                <div><b>06</b><span><strong>Condiciones del plan</strong>Las características, límites y condiciones corresponden al plan seleccionado. Antes de comprar, verifica que este acceso se adapte a tu forma de uso.</span></div>
              </div>
              <label className="terms-check"><input type="checkbox" id="vexora-terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} /><span>Acepto haber leído y comprendido las condiciones del acceso seleccionado.</span></label>
              <div className="purchase-actions">
                <a href={"https://wa.me/51992491189?text=" + encodeURIComponent("Hola VEXORA, quiero adquirir " + brand.name + " — " + selectedPlan.name + " — " + selectedPlan.price + " — " + selectedPlan.duration + ".")} target="_blank" rel="noreferrer" className={"purchase-action whatsapp" + (termsAccepted ? "" : " disabled")} aria-disabled={!termsAccepted} onClick={(e) => { if (!termsAccepted) e.preventDefault(); }}>Solicitar por WhatsApp <span>↗</span></a>
                <a href={"https://t.me/Camerdj?text=" + encodeURIComponent("Hola VEXORA, quiero adquirir " + brand.name + " — " + selectedPlan.name + " — " + selectedPlan.price + " — " + selectedPlan.duration + ".")} target="_blank" rel="noreferrer" className={"purchase-action telegram" + (termsAccepted ? "" : " disabled")} aria-disabled={!termsAccepted} onClick={(e) => { if (!termsAccepted) e.preventDefault(); }}>Solicitar por Telegram <span>↗</span></a>
              </div>
              <small className="purchase-note">Al continuar, VEXORA recibirá tu solicitud para coordinar disponibilidad, pago y entrega.</small>
            </div>
          </div>
        </div>
      )}

      <footer className="brand-page-footer">
        <Link href="/">VEXORA — Tu acceso a lo digital.</Link>
      </footer>
    </main>
  );
}
