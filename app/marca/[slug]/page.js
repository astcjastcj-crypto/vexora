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
    plans: [
      { name: "Gemini IA Pro", duration: "18 meses", price: "S/20", note: "Activación en tu propio Gmail · Sin garantía, garantía de activación" }
    ]
  },
  spotify: {
    name: "Spotify",
    type: "Streaming",
    logo: "https://cdn.simpleicons.org/spotify",
    plans: [
      { name: "Premium", duration: "3 meses", price: "S/40", note: "Correo y contraseña · No renovable" }
    ]
  },
  "canva-pro": {
    name: "Canva Pro",
    type: "Diseño",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Canva_logo.svg",
    plans: [
      { name: "Pro", duration: "1 año", price: "S/25", note: "Invitación al equipo · Garantía completa" }
    ]
  },
  "geforce-now": {
    name: "GeForce NOW",
    type: "Gaming",
    logo: "https://cdn.simpleicons.org/nvidia",
    plans: [
      { name: "Performance", duration: "1 mes", price: "S/25", note: "USD 7.5 · Hasta 1440p y 60 FPS" },
      { name: "Performance + 1 TB", duration: "1 mes", price: "S/42", note: "USD 12 · Performance + 1 TB de almacenamiento persistente" },
      { name: "Ultimate", duration: "1 mes", price: "S/47", note: "USD 13.5 · Hasta 5K/120 FPS y hasta 360 FPS" },
      { name: "Ultimate + 1 TB", duration: "1 mes", price: "S/65", note: "USD 18 · Ultimate + 1 TB de almacenamiento persistente" }
    ]
  }
};

const getPurchaseRules = (brandName, plan) => {
  if (brandName === "Gemini") {
    return [
      ["01", "Activación", "Recibirás un enlace para activar la oferta directamente en <em>tu propia cuenta de Gmail</em>."],
      ["02", "Duración", "El acceso corresponde a <em>18 meses</em> de Gemini IA Pro según la oferta indicada."],
      ["03", "Beneficios", "Incluye los beneficios disponibles de Gemini IA Pro, además de <em>5 TB de almacenamiento</em>, Nano Banana y Flow con créditos mensuales, según disponibilidad del servicio."],
      ["04", "Garantía", "Este producto <em>no tiene garantía durante el período de servicio</em>. La garantía corresponde únicamente a la activación."],
      ["05", "Cuenta personal", "La activación se realiza en tu propio Gmail. Verifica que estés utilizando la cuenta correcta antes de canjear el enlace."]
    ];
  }

  if (brandName === "Spotify") {
    return [
      ["01", "Acceso", "Recibirás el <em>correo y la contraseña</em> correspondientes al acceso adquirido."],
      ["02", "Duración", "El acceso tiene una duración de <em>3 meses</em>."],
      ["03", "Renovación", "Este acceso es <em>no renovable</em>. Al finalizar el período, deberás adquirir un nuevo acceso si deseas continuar."],
      ["04", "Uso", "No cambies el correo, contraseña ni la configuración del acceso entregado mientras esté activo."],
      ["05", "Antes de comprar", "Verifica que las condiciones de este acceso se adapten a tu forma de uso antes de solicitar la compra."]
    ];
  }

  if (brandName === "Canva Pro") {
    return [
      ["01", "Invitación", "Recibirás una <em>invitación en tu correo</em> para unirte al equipo de Canva Pro."],
      ["02", "Activación", "Debes aceptar la invitación recibida para activar tu acceso. Utiliza el correo correcto antes de solicitar la compra."],
      ["03", "Duración", "El acceso corresponde a <em>1 año</em> de Canva Pro."],
      ["04", "Garantía", "Este producto cuenta con <em>garantía completa</em> durante el período indicado, según las condiciones de VEXORA."],
      ["05", "Uso", "No abandones el equipo ni realices cambios que puedan afectar la activación o el acceso mientras el servicio esté vigente."]
    ];
  }

  if (brandName === "GeForce NOW") {
    const isUltimate = plan.name.includes("Ultimate");
    const hasStorage = plan.name.includes("1 TB");
    return [
      ["01", "Biblioteca", "Puedes conectar bibliotecas compatibles como Steam, Epic Games, GOG, PC Game Pass y Ubisoft Connect para jugar títulos que ya posees."],
      ["02", "Rendimiento", isUltimate ? "Ultimate ofrece servidores de mayor rendimiento, con streaming de hasta <em>5K a 120 FPS</em> y hasta <em>360 FPS</em> en escenarios compatibles." : "Performance ofrece streaming premium de hasta <em>1440p a 60 FPS</em>, según dispositivo, juego y conexión."],
      ["03", "Tecnologías", "Los planes premium incluyen tecnologías como <em>Ray Tracing, NVIDIA DLSS y Reflex</em>, además de acceso prioritario a los servidores."],
      ["04", "Install-to-Play", "Performance y Ultimate incluyen acceso a <em>Install-to-Play</em> para ampliar la biblioteca con miles de juegos Steam compatibles. También incluyen 100 GB de almacenamiento de sesión para esta función."],
      ["05", "Almacenamiento", hasStorage ? "Este plan añade <em>1 TB de almacenamiento persistente</em> para conservar instalaciones y datos entre sesiones, según compatibilidad." : "El almacenamiento persistente de 1 TB no está incluido en este plan; puede existir como complemento independiente según disponibilidad."],
      ["06", "Tiempo de juego", "Actualmente, Performance y Ultimate cuentan con <em>100 horas mensuales</em> de juego premium. Las horas no utilizadas pueden acumularse hasta el límite indicado por NVIDIA."],
      ["07", "Requisitos", "El rendimiento real depende del dispositivo, juego, resolución, conexión y latencia. Se requiere una conexión adecuada y una cuenta del servicio."]
    ];
  }

  return [
    ["01", "Acceso y dispositivo", "El plan compartido está destinado a <em>1 dispositivo por cliente</em>. Recibirás el correo y la contraseña para ingresar."],
    ["02", "Código de acceso", "Al iniciar sesión, el servicio puede solicitar un código de verificación. <em>El código será proporcionado por el administrador de VEXORA</em> cuando corresponda."],
    ["03", "Uso responsable", "No cambies el correo, contraseña, método de acceso ni la configuración de la cuenta."],
    ["04", "Proyectos y archivos", "Si utilizas proyectos, conversaciones o archivos importantes, mantén siempre una copia propia."],
    ["05", "Imágenes y archivos", "Las funciones pueden estar sujetas a límites de uso según el tipo de acceso y disponibilidad del servicio."],
    ["06", "Condiciones del plan", "Las características, límites y condiciones corresponden al plan seleccionado."]
  ];
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
                {getPurchaseRules(brand.name, selectedPlan).map(([number, title, description]) => (
                  <div key={number}><b>{number}</b><span><strong>{title}</strong><span dangerouslySetInnerHTML={{ __html: description }} /></span></div>
                ))}
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
