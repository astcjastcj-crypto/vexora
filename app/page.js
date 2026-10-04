"use client";

import { useRef, useState } from "react";

const products = [
  { name: "ChatGPT", type: "Inteligencia Artificial", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/ChatGPT-Logo.svg", price: "Desde S/19" },
  { name: "Gemini", type: "Inteligencia Artificial", logo: "https://cdn.simpleicons.org/googlegemini", price: "Desde S/25" },
  { name: "Spotify", type: "Streaming", logo: "https://cdn.simpleicons.org/spotify", price: "Desde S/8" },
  { name: "Canva Pro", type: "Diseño", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Canva_logo.svg", price: "Desde S/3" },
  { name: "GeForce NOW", type: "Gaming", logo: "https://cdn.simpleicons.org/nvidia", price: "Desde S/25" },
];

const categories = ["Todos", "IA", "Streaming", "Gaming", "Productividad", "Diseño"];

export default function Home() {
  const [active, setActive] = useState(0);
  const [category, setCategory] = useState("Todos");
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0, rotate: 0 });
  const filteredProducts = category === "Todos"
    ? products
    : products.filter((product) => {
        const map = { IA: "Inteligencia Artificial" };
        return product.type === (map[category] || category);
      });
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const [launching, setLaunching] = useState(null);

  const move = (direction) => {
    setActive((current) => (current + direction + products.length) % products.length);
    setLogoPosition({ x: 0, y: 0, rotate: 0 });
  };

  const startDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    movedRef.current = false;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: logoPosition.x,
      originY: logoPosition.y,
      originRotate: logoPosition.rotate,
    };
  };

  const dragLogo = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) movedRef.current = true;
    const x = Math.max(-150, Math.min(150, dragRef.current.originX + dx));
    const y = Math.max(-120, Math.min(120, dragRef.current.originY + dy));
    const rotate = dragRef.current.originRotate + dx * 0.55;
    setLogoPosition({ x, y, rotate });
  };

  const endDrag = () => {
    dragRef.current = null;
    setLogoPosition({ x: 0, y: 0, rotate: 0 });
  };

  const openProduct = (product) => {
    if (movedRef.current) return;
    setLaunching(product);
    window.setTimeout(() => {
      window.location.href = "/marca/" + encodeURIComponent(product.name.toLowerCase().replace(/\\s+/g, "-"));
    }, 2350);
  };

  const selectCategory = (item) => {
    setCategory(item);
    window.requestAnimationFrame(() => {
      document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <main className="vexora-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {launching && (
        <div className={"product-launch brand-launch-" + launching.name.toLowerCase().replace(/\\s+/g, "-")} aria-hidden="true">
          <div className="launch-vignette" />
          <div className="launch-particle launch-particle-one" />
          <div className="launch-particle launch-particle-two" />
          <div className="launch-particle launch-particle-three" />
          <div className="launch-ring launch-ring-one" />
          <div className="launch-ring launch-ring-two" />
          <div className="launch-ring launch-ring-three" />
          <div className="launch-energy" />
          <div className="launch-logo-wrap">
            <span className="launch-logo-depth" />
            <img src={launching.logo} alt="" />
          </div>
          <div className="launch-label"><span>VEXORA</span><strong>{launching.name.toUpperCase()}</strong><small>PREPARANDO TU ACCESO</small></div>
        </div>
      )}

      <header className="topbar">
        <a className="brand" href="#"><span className="brand-orb" /><span>VEXORA</span></a>
        <nav className="desktop-nav">
          <a className="nav-active" href="#inicio">Inicio</a>
          <a href="#productos">Productos</a>
          <a href="#categorias">Categorías</a>
          <a href="#nosotros">Nosotros</a>
        </nav>
        <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar"><span>⌕</span></button>
      </header>

      {searchOpen && (
        <div className="search-panel">
          <span>⌕</span><input autoFocus placeholder="Buscar productos..." />
          <button onClick={() => setSearchOpen(false)}>Cerrar</button>
        </div>
      )}

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span /> ACCESO DIGITAL PREMIUM</div>
          <h1>Tu mundo digital,<strong> en un solo lugar.</strong></h1>
          <p>Descubre herramientas de IA, entretenimiento, gaming y productividad. Accesos digitales seleccionados para ti.</p>
          <div className="hero-actions">
            <a href="#productos" className="primary-button">Explorar productos <span>↗</span></a>
            <a href="#categorias" className="ghost-button">Ver categorías</a>
          </div>
          <div className="trust-row">
            <span><b>✦</b> Entrega rápida</span><span><b>✦</b> Atención directa</span><span><b>✦</b> Precios competitivos</span>
          </div>
        </div>

        <div className="showcase logo-showcase" aria-label="Productos destacados">
          <div className="showcase-glow" />
          <button className="carousel-arrow left" onClick={() => move(-1)} aria-label="Logo anterior">‹</button>

          <div className="logo-stage">
            {products.map((product, index) => {
              let offset = index - active;
              if (offset > 2) offset -= products.length;
              if (offset < -2) offset += products.length;

              if (offset !== 0) {
                return (
                  <button className={"floating-logo side-logo side-" + offset} key={product.name} onClick={() => move(offset)} aria-label={"Ver " + product.name}>
                    <img src={product.logo} alt={product.name + " logo"} draggable="false" />
                  </button>
                );
              }

              return (
                <button
                  className="floating-logo main-logo"
                  key={product.name}
                  onPointerDown={startDrag}
                  onPointerMove={dragLogo}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onDoubleClick={() => setLogoPosition({ x: 0, y: 0, rotate: 0 })}
                  onClick={() => openProduct(product)}
                  aria-label={"Abrir " + product.name}
                  style={{ transform: "translate3d(" + logoPosition.x + "px, " + logoPosition.y + "px, 100px) rotateY(" + logoPosition.rotate + "deg) rotateZ(" + (logoPosition.rotate * 0.08) + "deg)" }}
                >
                  <span className="logo-aura" />
                  <span className="logo-3d">
                    <span className="logo-depth" aria-hidden="true">
                      {Array.from({ length: 14 }).map((_, layer) => (
                        <img key={layer} src={product.logo} alt="" draggable="false" style={{ transform: "translateZ(" + (-layer * 1.5) + "px)" }} />
                      ))}
                    </span>
                    <img className="logo-face" src={product.logo} alt={product.name + " logo"} draggable="false" />
                  </span>
                </button>
              );
            })}
          </div>

          <button className="carousel-arrow right" onClick={() => move(1)} aria-label="Siguiente logo">›</button>

          <div className="logo-caption">
            <span>{products[active].type}</span><strong>{products[active].name}</strong><small>{products[active].price}</small>
          </div>

          <div className="carousel-dots">
            {products.map((product, index) => (
              <button key={product.name} className={index === active ? "dot active" : "dot"} onClick={() => setActive(index)} aria-label={"Ver " + product.name} />
            ))}
          </div>
        </div>
      </section>

      <section className="category-section" id="categorias">
        <div className="section-heading">
          <div><span className="section-kicker">EXPLORA</span><h2>Encuentra lo que necesitas.</h2></div>
          <p>Una colección digital pensada para simplificar tu día.</p>
        </div>
        <div className="category-pills">
          {categories.map((item) => (
            <button key={item} className={category === item ? "category-pill active" : "category-pill"} onClick={() => selectCategory(item)}>
              <span>{item === "IA" ? "✦" : item === "Gaming" ? "⌁" : item === "Diseño" ? "◈" : "•"}</span>{item}
            </button>
          ))}
        </div>
      </section>

      <section className="products-section" id="productos">
        <div className="section-heading compact">
          <div><span className="section-kicker">SELECCIÓN VEXORA</span><h2>Productos populares</h2></div>
          <button className="view-all">Ver todos →</button>
        </div>
        <div className="product-grid" key={category}>
          {filteredProducts.slice(0, 4).map((product, index) => (
            <article className="mini-product" key={product.name}>
              <div className={"mini-mark mark-" + index}><img src={product.logo} alt={product.name + " logo"} /></div>
              <div><span>{product.type}</span><h3>{product.name}</h3><p>{product.price}</p></div>
              <button aria-label={"Ver " + product.name}>↗</button>
            </article>
          ))}
          {filteredProducts.length === 0 && (
            <div className="empty-category">
              <span>PRÓXIMAMENTE</span>
              <strong>Estamos preparando esta categoría.</strong>
              <p>VEXORA irá incorporando nuevos productos aquí.</p>
            </div>
          )}
        </div>
      </section>

      <section className="closing-section" id="nosotros">
        <span className="section-kicker">VEXORA</span><h2>Tu acceso a lo digital.</h2><p>Simple. Moderno. Digital.</p>
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
