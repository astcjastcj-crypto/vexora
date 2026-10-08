"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { supabase } from "../../../utils/supabase/client";

const brands = {
  chatgpt: {
    name: "ChatGPT",
    type: "Inteligencia Artificial",
    logo: "/logos/openai.svg",
    intro: "Una inteligencia artificial para ayudarte a crear, aprender, resolver problemas y trabajar de forma más rápida.",
    benefitTitle: "¿Para qué sirve?",
    benefits: [
      ["01", "Crear contenido", "Redacta textos, ideas, guiones, publicaciones y mucho más."],
      ["02", "Aprender y resolver dudas", "Explica temas, responde preguntas y te ayuda a estudiar."],
      ["03", "Programar", "Ayuda a escribir, revisar y entender código."],
      ["04", "Analizar información", "Trabaja con textos, archivos e información para ayudarte a encontrar respuestas."]
    ],
    plans: [
      { name: "Cuenta Compartida", duration: "1 mes", price: "S/19", note: "Acceso compartido · 1 dispositivo" },
      { name: "Cuenta Completa", duration: "1 mes", price: "S/40", note: "Correo + contraseña + 2FA · Sin garantía" },
      { name: "Cuenta Completa", duration: "1 mes", price: "S/65", note: "Correo + contraseña + 2FA · Garantía todo el mes" },
      { name: "GPT Pro", duration: "1 mes", price: "S/80", note: "Cuenta compartida" }
    ]
  },
  gemini: {
    name: "Gemini",
    type: "Inteligencia Artificial",
    logo: "https://cdn.simpleicons.org/googlegemini",
    intro: "La inteligencia artificial de Google para crear, investigar, analizar información y trabajar desde tu propia cuenta.",
    benefitTitle: "¿Para qué sirve?",
    benefits: [
      ["01", "Crear y escribir", "Genera ideas, textos, contenido y ayuda a mejorar lo que escribes."],
      ["02", "Investigar y aprender", "Te ayuda a comprender temas, organizar información y resolver dudas."],
      ["03", "Crear contenido visual", "Accede a herramientas de creación de imágenes y funciones de IA disponibles en tu plan."],
      ["04", "Más espacio y herramientas", "La oferta incluye beneficios de Gemini IA Pro, almacenamiento y funciones adicionales según disponibilidad."]
    ],
    plans: [
      { name: "Gemini IA Pro", duration: "18 meses", price: "S/20", note: "Activación en tu propio Gmail · Sin garantía, garantía de activación" }
    ]
  },
  spotify: {
    name: "Spotify",
    type: "Streaming",
    logo: "https://cdn.simpleicons.org/spotify",
    intro: "Escucha música, podcasts y contenido de audio con una experiencia Premium y sin las limitaciones habituales del acceso gratuito.",
    benefitTitle: "¿Para qué sirve?",
    benefits: [
      ["01", "Escuchar sin interrupciones", "Disfruta tu música con una experiencia sin anuncios según las funciones disponibles de Premium."],
      ["02", "Tu música donde quieras", "Accede a tus canciones, álbumes, playlists y podcasts desde dispositivos compatibles."],
      ["03", "Descargas para escuchar offline", "Guarda contenido para disfrutarlo sin conexión, según las funciones disponibles de Premium."],
      ["04", "Mayor control", "Disfruta una experiencia de reproducción más completa y con más opciones que el acceso gratuito."]
    ],
    plans: [
      { name: "Premium", duration: "3 meses", price: "S/40", note: "Correo y contraseña · No renovable" }
    ]
  },
  "canva-pro": {
    name: "Canva Pro",
    type: "Diseño",
    logo: "/logos/canva.svg",
    intro: "Una plataforma de diseño para crear contenido profesional de forma sencilla, incluso si no eres diseñador.",
    benefitTitle: "¿Para qué sirve?",
    benefits: [
      ["01", "Diseñar contenido", "Crea publicaciones, historias, flyers, presentaciones y piezas para redes sociales."],
      ["02", "Editar imágenes", "Utiliza herramientas de edición y recursos visuales para mejorar tus diseños."],
      ["03", "Crear contenido para marcas", "Trabaja con plantillas, estilos y recursos para mantener una identidad visual."],
      ["04", "Trabajar más rápido", "Aprovecha las funciones Pro y recursos premium disponibles en Canva."]
    ],
    plans: [
      { name: "Pro", duration: "1 año", price: "S/25", note: "Invitación al equipo · Garantía completa" }
    ]
  },
  "geforce-now": {
    name: "GeForce NOW",
    type: "Gaming",
    logo: "https://cdn.simpleicons.org/nvidia",
    intro: "Juega en la nube sin necesitar una PC gamer potente. El juego se ejecuta en servidores de NVIDIA y se transmite a tu dispositivo.",
    benefitTitle: "¿Para qué sirve?",
    benefits: [
      ["01", "Jugar juegos AAA en la nube", "Disfruta juegos exigentes sin tener que contar con una tarjeta gráfica de alta gama."],
      ["02", "No necesitas un equipo potente", "Puedes jugar desde un PC, laptop, Mac o dispositivo móvil compatible sin que el juego dependa de la potencia del equipo."],
      ["03", "Conecta tus bibliotecas", "Accede a juegos compatibles que ya posees en Steam, Epic Games, GOG, PC Game Pass y Ubisoft Connect."],
      ["04", "La conexión es clave", "Necesitas una buena conexión a Internet y baja latencia para obtener una experiencia fluida."]
    ],
    plans: [
      { name: "Performance", duration: "1 mes", price: "S/25", note: "USD 7.5 · Activación en tu propio correo · RTX · hasta 1440p/60 FPS · 100 h/mes" },
      { name: "Performance + 1 TB", duration: "1 mes", price: "S/42", note: "USD 12 · Activación en tu propio correo · Performance + 1 TB" },
      { name: "Ultimate", duration: "1 mes", price: "S/47", note: "USD 13.5 · Activación en tu propio correo · RTX 5080 · hasta 5K HDR/120 FPS · 100 h/mes" },
      { name: "Ultimate + 1 TB", duration: "1 mes", price: "S/65", note: "USD 18 · Activación en tu propio correo · Ultimate + 1 TB" }
    ]
  }
};

const getPurchaseRules = (brandName, plan) => {
  if (brandName === "ChatGPT") {
    const isComplete = plan.name === "Cuenta Completa";
    const hasWarranty = isComplete && plan.price === "S/65";
    if (isComplete) {
      return [
        ["01", "Qué recibes", "Se entrega <em>correo electrónico + contraseña + acceso 2FA</em> para iniciar sesión en la cuenta."],
        ["02", "Google Authenticator", "Para utilizar el 2FA necesitarás instalar la aplicación <em>Google Authenticator</em> en tu dispositivo y utilizar el código temporal cuando sea solicitado."],
        ["03", "Configuración 2FA", "Debes completar correctamente la configuración del autenticador para poder acceder a la cuenta. Guarda de forma segura la información necesaria para el acceso."],
        ["04", "Uso personal", "La Cuenta Completa está destinada al uso personal. No compartas el correo, contraseña ni los datos de seguridad con terceros."],
        ["05", "Garantía", hasWarranty ? "Este plan incluye <em>garantía durante todo el mes</em>, de acuerdo con las condiciones de VEXORA." : "Este plan es <em>sin garantía</em>. Revisa las condiciones antes de solicitar la compra."],
        ["06", "Recomendación", "Antes de comprar, asegúrate de poder instalar y utilizar Google Authenticator en el dispositivo que usarás para iniciar sesión."]
      ];
    }
    if (plan.name === "Cuenta Compartida") {
      return [
        ["01", "Acceso", "Recibirás los datos necesarios para ingresar al acceso compartido. Está destinado a <em>1 dispositivo por cliente</em>."],
        ["02", "Código de acceso", "Cuando el servicio solicite un código de verificación, <em>el código será proporcionado por el administrador de VEXORA</em> cuando corresponda."],
        ["03", "Uso compartido", "Al tratarse de un acceso compartido, evita cambiar el correo, contraseña, configuración o métodos de seguridad de la cuenta."],
        ["04", "Privacidad", "No recomendamos guardar información extremadamente privada o sensible en una cuenta compartida."],
        ["05", "Funciones", "Las funciones y límites disponibles pueden depender del acceso compartido y de las condiciones del servicio."]
      ];
    }
    return [
      ["01", "Acceso", "El plan seleccionado se entrega con las condiciones indicadas en su descripción."],
      ["02", "Uso responsable", "No cambies los datos de acceso ni la configuración de seguridad de la cuenta."],
      ["03", "Condiciones", "Las características, límites y condiciones corresponden al plan seleccionado."]
    ];
  }

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
      ["01", "Biblioteca", "Conecta tus bibliotecas compatibles de <em>Steam, Epic Games, GOG, PC Game Pass y Ubisoft Connect</em> para jugar títulos que ya posees."],
      ["02", "Rendimiento", isUltimate ? "Ultimate ofrece acceso prioritario a equipos <em>GeForce RTX 5080</em>, con streaming de hasta <em>5K HDR a 120 FPS</em> y hasta <em>360 FPS a 1080p</em> en escenarios compatibles." : "Performance ofrece equipos GeForce RTX con streaming de hasta <em>1440p a 60 FPS</em>, según dispositivo, juego, región y conexión."],
      ["03", "Tecnologías NVIDIA", "Los planes Premium incluyen <em>Ray Tracing, NVIDIA DLSS y Reflex</em>, además de acceso prioritario a la transmisión frente al plan gratuito."],
      ["04", "Install-to-Play", "Performance y Ultimate incluyen <em>Install-to-Play</em>, que permite instalar y jugar miles de juegos Steam compatibles. También incluyen <em>100 GB de almacenamiento de sesión</em> para esta función."],
      ["05", "Almacenamiento 1 TB", hasStorage ? "Este plan VEXORA incluye <em>1 TB de almacenamiento</em> adicional según la modalidad contratada." : "Este plan no incluye el adicional de 1 TB; está disponible en las modalidades <em>+ 1 TB</em>."],
      ["06", "100 horas mensuales", "Performance y Ultimate cuentan actualmente con <em>100 horas de juego premium al mes</em>. NVIDIA permite transferir hasta 15 horas no utilizadas al siguiente mes."],
      ["07", "¿Qué puedes jugar?", "GeForce NOW ofrece acceso a miles de juegos compatibles. Entre los títulos disponibles se encuentran <em>Fortnite, Cyberpunk 2077, The Witcher 3, Battlefield 6, ARC Raiders y Borderlands 4</em>, sujeto a disponibilidad por región y tienda."],
      ["08", "Activación en tu correo", "La activación se realiza en <em>tu propio correo/cuenta de GeForce NOW</em>. No necesitas compartir tu contraseña de correo con VEXORA; recibirás la activación para usar tu propia cuenta."],
      ["09", "¿Qué necesitas?", "Necesitas una cuenta de GeForce NOW y una conexión a Internet adecuada. El rendimiento final depende del dispositivo, juego, resolución y latencia."]
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

const makeSlug = (value = "") =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/\\+/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function BrandPage() {
  const params = useParams();
  const pathname = usePathname();
  const rawSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || pathname?.split("/").filter(Boolean).pop() || "";
  const slug = makeSlug(rawSlug);
  const resolvedSlug = slug === "geforce-now" || pathname?.toLowerCase().includes("/marca/geforce-now") ? "geforce-now" : slug;
  const fallbackBrand = resolvedSlug === "geforce-now" ? brands["geforce-now"] : brands[resolvedSlug] || null;
  const [brand, setBrand] = useState(fallbackBrand);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setCurrentUser(data.session?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setCurrentUser(session?.user || null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadBrand = async () => {
      setCatalogLoading(true);

      try {
        const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id,name,category,description,logo_url,price_from,active")
        .eq("active", true);

      if (!mounted) return;

      if (productsError) {
        console.error("Error cargando producto público:", productsError);
        setBrand(fallbackBrand);
        setCatalogLoading(false);
        return;
      }

      const product = (productsData || []).find(
        (item) => makeSlug(item.name) === resolvedSlug
      );

      if (!product) {
        setBrand(fallbackBrand);
        setCatalogLoading(false);
        return;
      }

      const [{ data: plansData, error: plansError }, { data: benefitsData, error: benefitsError }] =
        await Promise.all([
          supabase
            .from("product_plans")
            .select("id,name,duration,price,description,active,sort_order")
            .eq("product_id", product.id)
            .eq("active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("product_benefits")
            .select("id,text,active,sort_order")
            .eq("product_id", product.id)
            .eq("active", true)
            .order("sort_order", { ascending: true }),
        ]);

      if (!mounted) return;

      if (plansError) console.error("Error cargando planes públicos:", plansError);
      if (benefitsError) console.error("Error cargando beneficios públicos:", benefitsError);

      const fallbackPlans = fallbackBrand?.plans || [];
      const fallbackBenefits = fallbackBrand?.benefits || [];

      const plans = (plansData || []).map((plan) => ({
        ...plan,
        price: "S/" + Number(plan.price || 0).toFixed(2).replace(".00", ""),
        note: plan.description || "Acceso disponible según las condiciones del plan.",
      }));

      const benefits = (benefitsData || []).map((benefit, index) => ({
        number: String(index + 1).padStart(2, "0"),
        title: benefit.text,
        description: "",
      }));

        setBrand({
        name: product.name,
        type: product.category,
        logo: product.logo_url || fallbackBrand?.logo || "",
        intro: product.description || fallbackBrand?.intro || "Conoce este acceso digital disponible en VEXORA.",
        benefitTitle: fallbackBrand?.benefitTitle || "Beneficios",
        benefits: benefits.length ? benefits : (fallbackBrand ? fallbackBenefits : []),
        plans: plans.length ? plans : (fallbackBrand ? fallbackPlans : []),
      });
        setCatalogLoading(false);
      } catch (error) {
        console.error("Error inesperado cargando la marca:", error);
        setBrand(fallbackBrand);
        setCatalogLoading(false);
      }
    };

    loadBrand();

    return () => {
      mounted = false;
    };
  }, [resolvedSlug]);

  useEffect(() => {
    setTermsAccepted(false);
    setOrderMessage("");
    setSelectedPlan(null);
  }, [resolvedSlug]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedPlan(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPlan]);

  const createOrderAndContinue = async (channel) => {
    if (!selectedPlan || !termsAccepted || orderBusy) return;
    setOrderBusy(true);
    setOrderMessage("");
    try {
      let purchaseUser = currentUser;

      if (!purchaseUser) {
        const { data: guestData, error: guestError } = await supabase.auth.signInAnonymously({
          options: {
            data: { display_name: "Invitado VEXORA" },
          },
        });
        if (guestError) throw guestError;
        purchaseUser = guestData.user;
      }

      if (!purchaseUser?.id) {
        throw new Error("No pudimos activar tu acceso como invitado. Inténtalo de nuevo.");
      }

      const price = Number(String(selectedPlan.price).replace("S/", "").replace(",", ".").trim());
      if (!Number.isFinite(price)) throw new Error("No pudimos identificar el precio del plan.");
      const { data: order, error: orderError } = await supabase.from("orders").insert({
        user_id: purchaseUser.id,
        status: "pending",
        total: price,
        currency: "PEN",
        notes: "Solicitud creada desde VEXORA.",
      }).select("id").single();
      if (orderError) throw orderError;
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: order.id,
        product_name: brand.name,
        plan_name: selectedPlan.name,
        duration: selectedPlan.duration,
        price,
      });
      if (itemError) throw itemError;
      const shortOrderId = "VEX-" + order.id.slice(0, 8).toUpperCase();
      const message = "Hola VEXORA, quiero adquirir " + safeBrand.name + " — " + selectedPlan.name + " — " + selectedPlan.price + " — " + selectedPlan.duration + ". Mi pedido es " + shortOrderId + ".";
      const destination = channel === "telegram" ? "https://t.me/Camerdj?text=" + encodeURIComponent(message) : "https://wa.me/51992491189?text=" + encodeURIComponent(message);
      window.open(destination, "_blank", "noopener,noreferrer");
      setOrderMessage("Pedido creado correctamente. Ahora puedes continuar con VEXORA.");
    } catch (error) {
      setOrderMessage(error?.message || "No pudimos crear el pedido. Inténtalo de nuevo.");
    } finally { setOrderBusy(false); }
  };

  const safeBenefits = Array.isArray(brand?.benefits) ? brand.benefits : [];
  const safePlans = Array.isArray(brand?.plans) ? brand.plans : [];
  const isValidLogoSource = (value) =>
    typeof value === "string" && (/^\//.test(value.trim()) || /^https?:\/\//i.test(value.trim()));
  const safeBrand = brand
    ? {
        name: String(brand.name || "Acceso digital"),
        type: String(brand.type || "Digital"),
        logo: isValidLogoSource(brand.logo) ? brand.logo.trim() : (fallbackBrand?.logo || "/favicon.svg"),
        intro: String(brand.intro || "Conoce este acceso digital disponible en VEXORA."),
        benefitTitle: String(brand.benefitTitle || "Beneficios"),
        benefits: safeBenefits,
        plans: safePlans,
      }
    : null;

  if (catalogLoading && !brand) {
    return (
      <main className="brand-page">
        <header className="brand-page-topbar">
          <Link href="/" className="back-button">← Volver</Link>
          <span className="brand-page-title">VEXORA</span>
          <span className="brand-page-status">CATÁLOGO</span>
        </header>
        <section className="plans-empty brand-unavailable">
          <span>CARGANDO CATÁLOGO</span>
          <h3>Preparando este acceso.</h3>
          <p>Estamos cargando la información del producto.</p>
        </section>
      </main>
    );
  }

  if (!safeBrand) {
    return (
      <main className="brand-page">
        <header className="brand-page-topbar">
          <Link href="/" className="back-button">← Volver</Link>
          <span className="brand-page-title">VEXORA</span>
          <span className="brand-page-status">CATÁLOGO</span>
        </header>
        <section className="plans-empty brand-unavailable">
          <span>PRÓXIMAMENTE</span>
          <h3>Este acceso aún no está disponible.</h3>
          <p>Estamos preparando este servicio para VEXORA. Por ahora no hay planes disponibles para esta marca.</p>
          <Link href="/" className="brand-unavailable-back">Volver al catálogo</Link>
        </section>
      </main>
    );
  }

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
          <img src={safeBrand.logo} alt={safeBrand.name + " logo"} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackBrand?.logo || "/favicon.svg"; }} />
        </div>
        <div className="brand-hero-copy">
          <span>{safeBrand.type}</span>
          <h1>{safeBrand.name}</h1>
          <p>{safeBrand.intro}</p>
        </div>
      </section>

      <section className="benefits-section">
        <div className="benefits-heading">
          <span>CONOCE EL SERVICIO</span>
          <h2>{safeBrand.benefitTitle}</h2>
          <p>Conoce los beneficios principales de {safeBrand.name} antes de elegir el acceso que más te conviene.</p>
        </div>

        <div className="benefits-grid">
          {safeBrand.benefits.map((benefit, index) => {
            const [legacyNumber, legacyTitle, legacyDescription] = Array.isArray(benefit)
              ? benefit
              : [benefit.number, benefit.title, benefit.description];

            return (
              <article className="benefit-card" key={legacyNumber || index}>
                <span className="benefit-number">{legacyNumber || String(index + 1).padStart(2, "0")}</span>
                <div className="benefit-icon">✦</div>
                <h3>{legacyTitle}</h3>
                {legacyDescription ? <p>{legacyDescription}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="plans-section">
        <div className="plans-heading">
          <span>PLANES DISPONIBLES</span>
          <h2>Elige tu acceso</h2>
          <p>Selecciona un plan y luego coordinamos tu compra directamente con VEXORA.</p>
        </div>

        {safeBrand.plans.length ? (
          <div className="plans-grid">
            {safeBrand.plans.map((plan, index) => (
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
            <h3>Estamos preparando los planes de {safeBrand.name}.</h3>
            <p>Vuelve pronto para ver los accesos disponibles.</p>
          </div>
        )}
      </section>

      {selectedPlan && (
        <div className="purchase-overlay" role="dialog" aria-modal="true" aria-label={"Información de " + selectedPlan.name}>
          <div className="purchase-modal">
            <button className="purchase-close" onClick={() => setSelectedPlan(null)} aria-label="Cerrar">×</button>
            <div className="purchase-modal-head">
              <div className="purchase-modal-logo"><img src={safeBrand.logo} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackBrand?.logo || "/favicon.svg"; }} /></div>
              <div><span>{safeBrand.name} · {selectedPlan.duration}</span><h2>{selectedPlan.name}</h2><strong>{selectedPlan.price}</strong></div>
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
              {!currentUser && <div className="purchase-auth-note">👤 Puedes continuar como invitado. No necesitas crear una cuenta para solicitar este acceso.</div>}
              {orderMessage && <div className="purchase-order-message" role="status">{orderMessage}</div>}
              {termsAccepted && (
                <div className="purchase-actions">
                  <button type="button" className={"purchase-action whatsapp" + (orderBusy ? " disabled" : "")} disabled={orderBusy} onClick={() => createOrderAndContinue("whatsapp")}>{orderBusy ? "Creando pedido..." : "Solicitar por WhatsApp"} <span>↗</span></button>
                  <button type="button" className={"purchase-action telegram" + (orderBusy ? " disabled" : "")} disabled={orderBusy} onClick={() => createOrderAndContinue("telegram")}>{orderBusy ? "Creando pedido..." : "Solicitar por Telegram"} <span>↗</span></button>
                </div>
              )}
              <small className="purchase-note">Al continuar, VEXORA registrará tu pedido como pendiente y luego abrirá el canal elegido para coordinar disponibilidad, pago y entrega.</small>
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
