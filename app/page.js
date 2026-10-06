"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabase/client";

const products = [
  { name: "ChatGPT", type: "Inteligencia Artificial", logo: "https://cdn.simpleicons.org/openai/ffffff", price: "Desde S/19" },
  { name: "Gemini", type: "Inteligencia Artificial", logo: "https://cdn.simpleicons.org/googlegemini", price: "Desde S/20" },
  { name: "Spotify", type: "Streaming", logo: "https://cdn.simpleicons.org/spotify", price: "Desde S/40" },
  { name: "Canva Pro", type: "Diseño", logo: "https://cdn.simpleicons.org/canva/ffffff", price: "Desde S/25" },
  { name: "GeForce NOW", type: "Gaming", logo: "https://cdn.simpleicons.org/nvidia", price: "Desde S/25" },
];

const categories = ["Todos", "IA", "Streaming", "Gaming", "Productividad", "Diseño"];

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [category, setCategory] = useState("Todos");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [entryOpen, setEntryOpen] = useState(true);
  const [authTransition, setAuthTransition] = useState(false);
  const [mobileSection, setMobileSection] = useState("inicio");
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
  const searchResults = searchQuery.trim()
    ? products.filter((product) => (product.name + " " + product.type).toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : products;

  useEffect(() => {
    let mounted = true;

   const applySession = async (session) => {
  if (!mounted) return;

  if (!session?.user) {
    setCurrentUser(null);
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!mounted) return;

  setCurrentUser({
    ...session.user,
    profile: profile || null,
  });

  if (error) {
    console.error("Error cargando perfil:", error);
  }

  setEntryOpen(false);

  if (
    window.location.hash.includes("access_token") ||
    window.location.hash.includes("type=signup")
  ) {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + window.location.search
    );

    window.requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }
};

    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      applySession(data.session);
    };

    restoreSession();

    try {
      if (window.sessionStorage.getItem("vexora-entry-seen") === "1") setEntryOpen(false);
    } catch {}

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setProfileEditing(false);
      setProfileName("");
      setProfileMessage("");
      setUserOrders([]);
      return;
    }

    setProfileName(
      currentUser.profile?.full_name ||
      currentUser.user_metadata?.full_name ||
      ""
    );
    setProfileMessage("");
    setProfileAvatarFile(null);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    let mounted = true;
    const loadOrders = async () => {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total, currency, created_at, order_items(id, product_name, plan_name, duration, price)")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (mounted) {
        setUserOrders(error ? [] : (data || []));
        setOrdersLoading(false);
      }
    };

    loadOrders();
    return () => { mounted = false; };
  }, [currentUser]);

  useEffect(() => {
    const sections = ["inicio", "categorias", "productos", "nosotros"];
    const observers = sections.map((id) => {
      const element = document.getElementById(id);
      if (!element) return null;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setMobileSection(id);
      }, { rootMargin: "-25% 0px -55% 0px", threshold: 0 });
      observer.observe(element);
      return observer;
    });
    return () => observers.forEach((observer) => observer?.disconnect());
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const enterVexora = () => {
    try { window.sessionStorage.setItem("vexora-entry-seen", "1"); } catch {}
    setEntryOpen(false);
  };

  const submitEntryAuth = async (event) => {
    event.preventDefault();
    if (authBusy) return;
    setAuthMessage("");
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMessage("Completa tu correo y contraseña.");
      return;
    }
    setAuthBusy(true);
    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setAuthTransition(true);
        window.setTimeout(() => {
          try { window.sessionStorage.setItem("vexora-entry-seen", "1"); } catch {}
          setEntryOpen(false);
          setAuthTransition(false);
          setAuthBusy(false);
        }, 2300);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          data: { full_name: authName.trim() || null },
        },
      });
      if (error) throw error;

      if (!data.session) {
        setAuthMessage("Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.");
        setAuthBusy(false);
        setAuthMode("login");
        return;
      }

      setAuthTransition(true);
      window.setTimeout(() => {
        try { window.sessionStorage.setItem("vexora-entry-seen", "1"); } catch {}
        setEntryOpen(false);
        setAuthTransition(false);
        setAuthBusy(false);
      }, 2300);
    } catch (error) {
      setAuthMessage(error?.message || "No pudimos completar la operación. Inténtalo de nuevo.");
      setAuthBusy(false);
    }
  };

  const submitProfileAuth = async (event) => {
    event.preventDefault();
    if (authBusy) return;
    setAuthMessage("");
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMessage("Completa tu correo y contraseña.");
      return;
    }
    setAuthBusy(true);
    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setProfileOpen(false);
        setAuthMessage("");
        setAuthEmail("");
        setAuthPassword("");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: { data: { full_name: authName.trim() || null } },
        });
        if (error) throw error;
        if (!data.session) {
          setAuthMessage("Cuenta creada. Revisa tu correo para confirmar la cuenta.");
          setAuthMode("login");
        } else {
          setProfileOpen(false);
        }
      }
    } catch (error) {
      setAuthMessage(error?.message || "No pudimos completar la operación. Inténtalo de nuevo.");
    } finally {
      setAuthBusy(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!currentUser || profileBusy) return;

    const trimmedName = profileName.trim();
    if (!trimmedName) {
      setProfileMessage("Escribe tu nombre antes de guardar.");
      return;
    }

    setProfileBusy(true);
    setProfileMessage("");

    try {
      let avatarUrl = currentUser.profile?.avatar_url || null;

      if (profileAvatarFile) {
        avatarUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const image = new Image();
            image.onload = () => {
              const maxSize = 500;
              const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, Math.round(image.width * scale));
              canvas.height = Math.max(1, Math.round(image.height * scale));
              const context = canvas.getContext("2d");
              context.drawImage(image, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL("image/jpeg", 0.82));
            };
            image.onerror = () => reject(new Error("No pudimos procesar la imagen."));
            image.src = reader.result;
          };
          reader.onerror = () => reject(new Error("No pudimos leer la imagen."));
          reader.readAsDataURL(profileAvatarFile);
        });
      }

      const { data: updatedUser, error: authError } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      if (authError) throw authError;

      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id)
        .select("id, full_name, avatar_url, role")
        .single();

      if (profileError) throw profileError;

      setCurrentUser({
        ...(updatedUser?.user || currentUser),
        profile: updatedProfile,
      });
      setProfileAvatarFile(null);
      setProfileEditing(false);
      setProfileMessage("Perfil actualizado correctamente.");
    } catch (error) {
      setProfileMessage(error?.message || "No pudimos actualizar tu perfil.");
    } finally {
      setProfileBusy(false);
    }
  };

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
    const slug = product.name.toLowerCase().replace(/\s+/g, "-");
    const path = "/marca/" + encodeURIComponent(slug);
    router.prefetch(path);
    setLaunching(product);
    window.setTimeout(() => {
      router.push(path);
    }, 2050);
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

      {entryOpen && (
        <div className={authTransition ? "entry-gate is-transitioning" : "entry-gate"} role="dialog" aria-modal="true" aria-label="Bienvenido a VEXORA">
          <div className="entry-noise" aria-hidden="true" />
          <div className="entry-stars" aria-hidden="true">
            {products.map((product, index) => (
              <span key={product.name} className={"entry-brand entry-brand-" + index}>
                <span className="entry-brand-orbit" />
                <img src={product.logo} alt="" />
              </span>
            ))}
          </div>

          <div className="entry-visual">
            <div className="entry-visual-grid" />
            <div className="entry-orbit entry-orbit-a" />
            <div className="entry-orbit entry-orbit-b" />
            <div className="entry-orbit entry-orbit-c" />
            <div className="entry-core">
              <span className="entry-core-depth">V</span>
              <span className="entry-core-face">V</span>
            </div>
            <span className="entry-scan-line" />
            <div className="entry-visual-copy">
              <span>VEXORA</span>
              <strong>Tu acceso a lo digital.</strong>
              <small>IA · STREAMING · GAMING · PRODUCTIVIDAD</small>
            </div>
          </div>

          <div className="entry-panel">
            <div className="entry-panel-top">
              <span className="entry-kicker">ESPACIO VEXORA</span>
              <span className="entry-status"><i /> ONLINE</span>
            </div>
            <div className="entry-heading">
              <span className="entry-mini-orb">V</span>
              <h1>{authMode === "login" ? "Bienvenido." : "Crea tu cuenta."}</h1>
              <p>{authMode === "login"
                ? "Entra a tu espacio y lleva tus accesos, pedidos y compras contigo."
                : "Crea tu espacio VEXORA y mantén todo lo digital en un solo lugar."}</p>
            </div>

            <form className="entry-auth-form" onSubmit={submitEntryAuth}>
              {authMode === "register" && (
                <label>
                  <span>Nombre</span>
                  <input type="text" value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Tu nombre" autoComplete="name" />
                </label>
              )}
              <label>
                <span>Correo electrónico</span>
                <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="tu@email.com" autoComplete="email" required />
              </label>
              <label>
                <span>Contraseña</span>
                <input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="••••••••" autoComplete={authMode === "login" ? "current-password" : "new-password"} required />
              </label>
              {authMessage && <div className="entry-auth-message" role="alert">{authMessage}</div>}
              <button type="submit" className="entry-submit" disabled={authBusy}>
                <span>{authBusy ? "Procesando..." : (authMode === "login" ? "Iniciar sesión" : "Crear cuenta")}</span>
                <b>↗</b>
              </button>
            </form>

            <button type="button" className="entry-switch" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              {authMode === "login" ? "¿No tienes cuenta? Crear cuenta" : "¿Ya tienes cuenta? Iniciar sesión"}
            </button>

            <div className="entry-divider"><span>O</span></div>

            <button type="button" className="entry-guest" onClick={enterVexora}>
              <span>Continuar como visitante</span><b>→</b>
            </button>
            <small className="entry-note">Tu cuenta se guarda de forma segura con Supabase Auth. Podrás administrar tu espacio desde Perfil.</small>
          </div>

          {authTransition && (
            <div className="entry-transition" aria-live="polite">
              <div className="transition-ring transition-ring-a" />
              <div className="transition-ring transition-ring-b" />
              <div className="transition-core">V</div>
              <span>VEXORA</span>
              <strong>ENTRANDO A TU ESPACIO</strong>
              <small>PREPARANDO TU EXPERIENCIA DIGITAL</small>
            </div>
          )}
        </div>
      )}

      {launching && (
        <div className={"product-launch brand-launch-" + launching.name.toLowerCase().replace(/\s+/g, "-")} aria-hidden="true">
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
        <div className="topbar-actions">
          <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar"><span>⌕</span></button>
          <button className={currentUser ? "profile-top-button profile-top-button-active" : "profile-top-button"} onClick={() => setProfileOpen(true)} aria-label="Abrir perfil">
            <span className="profile-top-avatar">{currentUser?.profile?.avatar_url ? <img src={currentUser.profile.avatar_url} alt="" /> : ((currentUser?.profile?.full_name || currentUser?.user_metadata?.full_name || "").trim()?.charAt(0)?.toUpperCase() || "V")}</span>
            <span className="profile-top-copy">
              <small>{currentUser ? "CUENTA ACTIVA" : "ESPACIO VEXORA"}</small>
              <strong>{currentUser ? (currentUser.profile?.full_name || currentUser.user_metadata?.full_name || "Mi cuenta") : "Perfil"}</strong>
            </span>
            <b>⌄</b>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSearchOpen(false);
        }}>
          <div className="search-modal" role="dialog" aria-modal="true" aria-label="Buscar en VEXORA">
            <div className="search-modal-top">
              <div className="search-input-wrap">
                <span>⌕</span>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Busca una herramienta o categoría..."
                  aria-label="Buscar productos"
                />
                {searchQuery && <button type="button" className="search-clear" onClick={() => setSearchQuery("")} aria-label="Limpiar búsqueda">×</button>}
              </div>
              <button type="button" className="search-close" onClick={() => setSearchOpen(false)}>Cerrar <kbd>ESC</kbd></button>
            </div>
            <div className="search-results-head">
              <span>{searchQuery ? "RESULTADOS" : "ACCESOS DISPONIBLES"}</span>
              <small>{searchResults.length} {searchResults.length === 1 ? "resultado" : "resultados"}</small>
            </div>
            <div className="search-results">
              {searchResults.map((product, index) => (
                <button
                  type="button"
                  className="search-result"
                  key={product.name}
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                    openProduct(product);
                  }}
                  style={{ "--search-delay": (index * 55) + "ms" }}
                >
                  <span className="search-result-logo"><img src={product.logo} alt="" /></span>
                  <span className="search-result-copy"><small>{product.type}</small><strong>{product.name}</strong><em>{product.price}</em></span>
                  <b>↗</b>
                </button>
              ))}
              {searchResults.length === 0 && (
                <div className="search-empty">
                  <span>⌁</span>
                  <strong>No encontramos ese acceso.</strong>
                  <p>Prueba con ChatGPT, Gemini, Spotify, Canva o GeForce NOW.</p>
                </div>
              )}
            </div>
          </div>
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
                  <button className={"floating-logo side-logo side-" + offset + " logo-brand-" + product.name.toLowerCase().replace(/\s+/g, "-")} key={product.name} onClick={() => move(offset)} aria-label={"Ver " + product.name}>
                    <img src={product.logo} alt={product.name + " logo"} draggable="false" />
                  </button>
                );
              }

              return (
                <button
                  className={"floating-logo main-logo logo-brand-" + product.name.toLowerCase().replace(/\s+/g, "-")}
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
                      {Array.from({ length: 18 }).map((_, layer) => (
                        <img key={layer} src={product.logo} alt="" draggable="false" style={{ transform: "translateZ(" + (-layer * 1.8) + "px)" }} />
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
          <div><span className="section-kicker">EXPLORA POR CATEGORÍA</span><h2>Encuentra lo que necesitas.</h2></div>
          <p>Descubre qué puedes hacer con VEXORA y entra directamente a las herramientas que buscas.</p>
        </div>

        <div className="category-showcase">
          {categories.filter((item) => item !== "Todos").map((item, index) => {
            const info = {
              IA: { icon: "✦", title: "Inteligencia Artificial", text: "Crea, estudia, programa y potencia tus ideas con herramientas de IA.", accent: "IA" },
              Streaming: { icon: "◉", title: "Streaming", text: "Música y entretenimiento para disfrutar tus contenidos favoritos.", accent: "STREAMING" },
              Gaming: { icon: "⌁", title: "Gaming", text: "Juega en la nube y disfruta experiencias que van más allá de tu hardware.", accent: "GAMING" },
              Productividad: { icon: "◇", title: "Productividad", text: "Herramientas para organizar, trabajar y llevar tus proyectos al siguiente nivel.", accent: "PRODUCTIVIDAD" },
              Diseño: { icon: "◈", title: "Diseño", text: "Crea contenido visual, diseños y proyectos con herramientas premium.", accent: "DISEÑO" }
            }[item];

            return (
              <button
                key={item}
                className={category === item ? "category-card active" : "category-card"}
                onClick={() => selectCategory(item)}
                style={{ "--category-delay": (index * 70) + "ms" }}
              >
                <span className="category-card-orbit" aria-hidden="true" />
                <span className="category-card-icon">{info.icon}</span>
                <span className="category-card-kicker">{info.accent}</span>
                <strong>{info.title}</strong>
                <span className="category-card-text">{info.text}</span>
                <span className="category-card-arrow">Explorar <b>↗</b></span>
              </button>
            );
          })}
        </div>

        <div className="category-pills">
          <button className={category === "Todos" ? "category-pill active" : "category-pill"} onClick={() => selectCategory("Todos")}>
            <span>✦</span>Todos
          </button>
        </div>
      </section>

      <section className="products-section" id="productos">
        <div className="category-result-head">
          <div>
            <span className="section-kicker">{category === "Todos" ? "TODOS LOS ACCESOS" : "CATEGORÍA SELECCIONADA"}</span>
            <h2>{category === "Todos" ? "Explora VEXORA" : (category === "IA" ? "Inteligencia Artificial" : category)}</h2>
            <p>{category === "Todos" ? "Selecciona una herramienta y descubre sus planes disponibles." : "Selecciona un servicio para conocer sus planes y condiciones."}</p>
          </div>
          <span className="result-count">{filteredProducts.length} {filteredProducts.length === 1 ? "opción" : "opciones"}</span>
        </div>

        <div className="product-grid category-product-grid" key={category}>
          {filteredProducts.slice(0, 6).map((product, index) => (
            <article
              className="mini-product"
              key={product.name}
              onClick={() => openProduct(product)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openProduct(product);
                }
              }}
              style={{ "--product-delay": (index * 70) + "ms" }}
            >
              <div className={"mini-mark mark-" + index}><img src={product.logo} alt={product.name + " logo"} /></div>
              <div><span>{product.type}</span><h3>{product.name}</h3><p>{product.price}</p></div>
              <button onClick={(event) => { event.stopPropagation(); openProduct(product); }} aria-label={"Ver planes de " + product.name}>↗</button>
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

      {profileOpen && (
        <div className="profile-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setProfileOpen(false);
        }}>
          <div className="profile-modal" role="dialog" aria-modal="true" aria-label="Perfil VEXORA">
            <button type="button" className="profile-close" onClick={() => setProfileOpen(false)} aria-label="Cerrar perfil">×</button>
            <div className="profile-orb">V</div>
            <span className="section-kicker">ESPACIO VEXORA</span>

            {currentUser ? (
              <>
                <h2>{profileEditing ? "Editar perfil." : "Tu espacio."}</h2>
                <p>{profileEditing
                  ? "Actualiza tu nombre. El correo de acceso permanece vinculado a tu cuenta."
                  : "Tu cuenta VEXORA está activa. Desde aquí podrás consultar tus pedidos y organizar tus accesos."}</p>

                {profileEditing ? (
                  <form className="auth-form profile-edit-form" onSubmit={saveProfile}>
                    <div className="profile-avatar-editor">
                      <div className="profile-avatar-preview">
                        {currentUser.profile?.avatar_url ? <img src={currentUser.profile.avatar_url} alt="Avatar de tu perfil" /> : <span>{(currentUser.profile?.full_name || currentUser.user_metadata?.full_name || "V").trim()?.charAt(0)?.toUpperCase() || "V"}</span>}
                      </div>
                      <div className="profile-avatar-copy">
                        <strong>Foto de perfil</strong>
                        <small>JPG, PNG o WEBP · máximo 2 MB</small>
                        <label className="profile-avatar-button">
                          <span>Elegir imagen</span>
                          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
                            const selectedFile = event.target.files?.[0] || null;
                            if (!selectedFile) return;
                            if (selectedFile.size > 2 * 1024 * 1024) { setProfileMessage("La imagen no puede superar los 2 MB."); event.target.value = ""; return; }
                            setProfileAvatarFile(selectedFile);
                            setProfileMessage("");
                          }} disabled={profileBusy} />
                        </label>
                        {profileAvatarFile && <small className="profile-avatar-selected">{profileAvatarFile.name}</small>}
                      </div>
                    </div>
                    <label>
                      <span>Nombre</span>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        placeholder="Tu nombre"
                        autoComplete="name"
                        autoFocus
                        disabled={profileBusy}
                      />
                    </label>
                    <label>
                      <span>Correo electrónico</span>
                      <input
                        type="email"
                        value={currentUser.email || ""}
                        readOnly
                        aria-readonly="true"
                      />
                    </label>
                    {profileMessage && <small className="profile-edit-message" role="status">{profileMessage}</small>}
                    <div className="profile-edit-actions">
                      <button
                        type="submit"
                        className="profile-login-button"
                        disabled={profileBusy}
                      >
                        {profileBusy ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button
                        type="button"
                        className="profile-secondary-button"
                        onClick={() => {
                          setProfileEditing(false);
                          setProfileMessage("");
                          setProfileAvatarFile(null);
                          setProfileName(currentUser.profile?.full_name || currentUser.user_metadata?.full_name || "");
                        }}
                        disabled={profileBusy}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="profile-account-card">
                      <span className="profile-account-label">CUENTA ACTIVA</span>
                      <div className="profile-account-avatar">
                        {currentUser.profile?.avatar_url ? <img src={currentUser.profile.avatar_url} alt="Avatar de tu perfil" /> : <span>{(currentUser.profile?.full_name || currentUser.user_metadata?.full_name || "V").trim()?.charAt(0)?.toUpperCase() || "V"}</span>}
                      </div>
                      <div className="profile-account-copy">
                        <strong>{currentUser.profile?.full_name || currentUser.user_metadata?.full_name || "Usuario VEXORA"}</strong>
                        <small>{currentUser.email}</small>
                      </div>
                    </div>

                    {profileMessage && <small className="profile-edit-message success" role="status">{profileMessage}</small>}

                    <button
                      type="button"
                      className="profile-login-button"
                      onClick={() => {
                        setProfileMessage("");
                        setProfileEditing(true);
                      }}
                    >
                      Editar perfil
                    </button>

                    <div className="profile-orders">
                      <div className="profile-orders-head">
                        <strong>Mis pedidos</strong>
                        <span>{userOrders.length} {userOrders.length === 1 ? "pedido" : "pedidos"}</span>
                      </div>

                      {ordersLoading ? (
                        <div className="profile-orders-empty">Cargando...</div>
                      ) : userOrders.length === 0 ? (
                        <div className="profile-orders-empty">
                          <p>Aún no tienes pedidos.</p>
                        </div>
                      ) : (
                        <div className="profile-orders-list">
                          {userOrders.map((order) => {
                            const item = order.order_items?.[0];
                            const shortId = "VEX-" + order.id.slice(0, 8).toUpperCase();
                            const statusLabel = order.status === "pending" ? "Pendiente" : order.status === "confirmed" ? "Confirmado" : order.status === "delivered" ? "Entregado" : order.status === "cancelled" ? "Cancelado" : order.status;
                            return (
                              <button type="button" className="profile-order-item" key={order.id} onClick={() => setSelectedOrder(order)}>
                                <div className="profile-order-main">
                                  <strong>{item?.product_name || "Pedido VEXORA"} — {item?.plan_name || "Acceso digital"}</strong>
                                  <span>{shortId}</span>
                                </div>
                                <div className="profile-order-meta">
                                  <strong>S/{Number(order.total || 0).toFixed(2)}</strong>
                                  <span className={"profile-order-status status-" + order.status}>{statusLabel}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedOrder && (
                        <div className="profile-order-detail">
                          <button type="button" className="profile-order-detail-close" onClick={() => setSelectedOrder(null)} aria-label="Cerrar detalle">×</button>
                          <span className="profile-account-label">DETALLE DEL PEDIDO</span>
                          <strong>{selectedOrder.order_items?.[0]?.product_name || "Pedido VEXORA"}</strong>
                          <div className="profile-order-detail-grid">
                            <span>Plan</span><b>{selectedOrder.order_items?.[0]?.plan_name || "—"}</b>
                            <span>Duración</span><b>{selectedOrder.order_items?.[0]?.duration || "—"}</b>
                            <span>Precio</span><b>S/{Number(selectedOrder.total || 0).toFixed(2)}</b>
                            <span>Estado</span><b>{selectedOrder.status === "pending" ? "Pendiente" : selectedOrder.status === "confirmed" ? "Confirmado" : selectedOrder.status === "delivered" ? "Entregado" : selectedOrder.status === "cancelled" ? "Cancelado" : selectedOrder.status}</b>
                            <span>Pedido</span><b>VEX-{selectedOrder.id.slice(0, 8).toUpperCase()}</b>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="profile-secondary-button profile-logout-button"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setCurrentUser(null);
                        setProfileOpen(false);
                        setAuthMode("login");
                        setAuthEmail("");
                        setAuthPassword("");
                        setAuthMessage("");
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <h2>{authMode === "login" ? "Bienvenido." : "Crea tu cuenta."}</h2>
                <p>{authMode === "login" ? "Accede a tu espacio para consultar tus pedidos y organizar tus accesos." : "Crea tu espacio VEXORA para tener tus compras y accesos en un solo lugar."}</p>
                <form className="auth-form" onSubmit={submitProfileAuth}>
                  {authMode === "register" && (
                    <label><span>Nombre</span><input type="text" value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Tu nombre" autoComplete="name" /></label>
                  )}
                  <label><span>Correo electrónico</span><input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="tu@email.com" required /></label>
                  <label><span>Contraseña</span><input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="••••••••" required /></label>
                  <button type="submit" className="profile-login-button" disabled={authBusy}>{authBusy ? "Procesando..." : (authMode === "login" ? "Iniciar sesión" : "Crear cuenta")}</button>
                </form>
                <button type="button" className="auth-switch" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                  {authMode === "login" ? "¿No tienes cuenta? Crear cuenta" : "¿Ya tienes cuenta? Iniciar sesión"}
                </button>
                <small className="auth-demo-note">{authMessage || "Tu cuenta se guarda de forma segura con Supabase Auth."}</small>
              </>
            )}
          </div>
        </div>
      )}

      <nav className="mobile-nav" aria-label="Navegación móvil">
        <a className={mobileSection === "inicio" ? "mobile-active" : ""} href="#inicio"><span>⌂</span>Inicio</a>
        <button className={searchOpen ? "mobile-active" : ""} onClick={() => setSearchOpen(true)}><span>⌕</span>Buscar</button>
        <a className={mobileSection === "categorias" ? "mobile-active" : ""} href="#categorias"><span>◈</span>Categorías</a>
        <a className={mobileSection === "productos" ? "mobile-active" : ""} href="#productos"><span>▣</span>Productos</a>
        <button className={profileOpen || mobileSection === "nosotros" ? "mobile-active" : ""} onClick={() => setProfileOpen(true)}><span>◯</span>Perfil</button>
      </nav>
    </main>
  );
}
