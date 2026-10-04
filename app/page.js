"use client";

import { useState } from "react";

const products = [
  { name: "ChatGPT", type: "Inteligencia Artificial", mark: "GPT", price: "Desde S/19" },
  { name: "Gemini", type: "Inteligencia Artificial", mark: "G", price: "Desde S/25" },
  { name: "Spotify", type: "Streaming", mark: "♪", price: "Desde S/8" },
  { name: "Canva Pro", type: "Diseño", mark: "C", price: "Desde S/3" },
  { name: "GeForce NOW", type: "Gaming", mark: "GF", price: "Desde S/25" },
];

const categories = ["Todos", "IA", "Streaming", "Gaming", "Productividad", "Diseño"];

export default function Home() {
  const [active, setActive] = useState(0);
  const [category, setCategory] = useState("Todos");
  const [searchOpen, setSearchOpen] = useState(false);

  const move = (direction) =>
    setActive((current) => (current + direction + products.length) % products.length);

  return (
    <main className="vexora-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-orb" />
          <span>VEXORA</span>
        </a>

        <nav className="desktop-nav">
          <a className="nav-active" href="#inicio">Inicio</a>
          <a href="#productos">Productos</a>
          <a href="#categorias">Categorías</a>
          <a href="#nosotros">Nosotros</a>
        </nav>

        <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar">
          <span>⌕</span>
        </button>
      </header>

      {searchOpen && (
        <div className="search-panel">
          <span>⌕</span>
          <input autoFocus placeholder="Buscar productos..." />
          <button onClick={() => setSearchOpen(false)}>Cerrar</button>
        </div>
      )}

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span /> ACCESO DIGITAL PREMIUM</div>
          <h1>
            Tu mundo digital,
            <strong> en un solo lugar.</strong>
          </h1>
          <p>
            Descubre herramientas de IA, entretenimiento, gaming y productividad.
            Accesos digitales seleccionados para ti.
          </p>
          <div className="hero-actions">
            <a href="#productos" className="primary-button">Explorar productos <span>↗</span></a>
            <a href="#categorias" className="ghost-button">Ver categorías</a>
          </div>
          <div className="trust-row">
            <span><b>✦</b> Entrega rápida</span>
            <span><b>✦</b> Atención directa</span>
            <span><b>✦</b> Precios competitivos</span>
          </div>
        </div>

        <div className="showcase" aria-label="Productos destacados">
          <div className="showcase-glow" />
          <button className="carousel-arrow left" onClick={() => move(-1)}>‹</button>
          <div className="carousel">
            {products.map((product, index) => {
              let offset = index - active;
              if (offset > 2) offset -= products.length;
              if (offset < -2) offset += products.length;

              return (
                <button
                  className={"product-orbit-card " + (offset === 0 ? "is-center" : "")}
                  style={{ "--offset": offset }}
                  key={product.name}
                  onClick={() => setActive(index)}
                >
                  <div className="card-shine" />
                  <div className="product-mark">{product.mark}</div>
                  <span className="product-type">{product.type}</span>
                  <strong>{product.name}</strong>
                  <small>{product.price}</small>
                  {offset === 0 && <span className="featured-pill">DESTACADO</span>}
                </button>
              );
            })}
          </div>
          <button className="carousel-arrow right" onClick={() => move(1)}>›</button>
          <div className="carousel-dots">
            {products.map((product, index) => (
              <button
                key={product.name}
                className={index === active ? "dot active" : "dot"}
                onClick={() => setActive(index)}
                aria-label={"Ver " + product.name}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="category-section" id="categorias">
        <div className="section-heading">
          <div>
            <span className="section-kicker">EXPLORA</span>
            <h2>Encuentra lo que necesitas.</h2>
          </div>
          <p>Una colección digital pensada para simplificar tu día.</p>
        </div>

        <div className="category-pills">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "category-pill active" : "category-pill"}
              onClick={() => setCategory(item)}
            >
              <span>{item === "IA" ? "✦" : item === "Gaming" ? "⌁" : item === "Diseño" ? "◈" : "•"}</span>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="products-section" id="productos">
        <div className="section-heading compact">
          <div>
            <span className="section-kicker">SELECCIÓN VEXORA</span>
            <h2>Productos populares</h2>
          </div>
          <button className="view-all">Ver todos →</button>
        </div>

        <div className="product-grid">
          {products.slice(0, 4).map((product, index) => (
            <article className="mini-product" key={product.name}>
              <div className={"mini-mark mark-" + index}>{product.mark}</div>
              <div>
                <span>{product.type}</span>
                <h3>{product.name}</h3>
                <p>{product.price}</p>
              </div>
              <button aria-label={"Ver " + product.name}>↗</button>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-section" id="nosotros">
        <span className="section-kicker">VEXORA</span>
        <h2>Tu acceso a lo digital.</h2>
        <p>Simple. Moderno. Digital.</p>
      </section>

      <nav className="mobile-nav">
        <a className="mobile-active" href="#inicio"><span>⌂</span>Inicio</a>
        <button onClick={() => setSearchOpen(true)}><span>⌕</span>Buscar</button>
        <a href="#categorias"><span>◈</span>Categorías</a>
        <a href="#productos"><span>▣</span>Productos</a>
        <a href="#nosotros"><span>◯</span>Perfil</a>
      </nav>
    </main>
  );
}
