"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase/client";
import "./admin.css";

const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const tabs = [
  ["overview", "Resumen", "⌂"],
  ["orders", "Pedidos", "▣"],
  ["customers", "Clientes", "◯"],
  ["catalog", "Catálogo", "◈"],
  ["accesses", "Accesos", "⌁"],
];

const catalog = [
  ["ChatGPT", "Inteligencia Artificial", "Desde S/19"],
  ["Gemini", "Inteligencia Artificial", "Desde S/20"],
  ["Spotify", "Streaming", "Desde S/40"],
  ["Canva Pro", "Diseño", "Desde S/25"],
  ["GeForce NOW", "Gaming", "Desde S/25"],
];

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusBusy, setStatusBusy] = useState(null);
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogFormOpen, setCatalogFormOpen] = useState(false);
  const [catalogEditing, setCatalogEditing] = useState(null);
  const [catalogForm, setCatalogForm] = useState({ name: "", category: "Inteligencia Artificial", description: "", price: "", active: true, logoFile: null, logoUrl: "" });

  const loadCatalog = async () => {
    setCatalogLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, description, logo_url, price_from, active, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) {
      setMessage("No pudimos cargar el catálogo. Ejecuta primero el SQL de catálogo en Supabase.");
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setCatalogLoading(false);
  };

  const loadAdmin = async (userId) => {
    setLoading(true);
    setMessage("");

    const { data: me, error: meError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .eq("id", userId)
      .maybeSingle();

    if (meError) {
      setMessage("No pudimos validar tu perfil de administrador.");
      setLoading(false);
      return;
    }

    setProfile(me);

    if (me?.role !== "admin") {
      setLoading(false);
      return;
    }

    const [ordersResult, customersResult, accessesResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id, user_id, status, total, currency, payment_method, notes, created_at, updated_at, profiles(id, full_name), order_items(id, product_name, plan_name, duration, price)")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("accesses")
        .select("id, order_item_id, access_type, email, username, two_factor_enabled, status, starts_at, expires_at, created_at, order_items(product_name, plan_name, order_id)")
        .order("created_at", { ascending: false }),
    ]);

    if (ordersResult.error || customersResult.error || accessesResult.error) {
      setMessage("El panel abrió, pero Supabase rechazó una o más consultas. Revisa las políticas de administrador.");
    }

    setOrders(ordersResult.data || []);
    await loadCatalog();
    setCustomers(customersResult.data || []);
    setAccesses(accessesResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) await loadAdmin(data.session.user.id);
      else setLoading(false);
    };

    boot();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession?.user) await loadAdmin(nextSession.user.id);
      else {
        setProfile(null);
        setOrders([]);
        setCustomers([]);
        setAccesses([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    const income = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const pending = orders.filter((order) => order.status === "pending").length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const activeAccesses = accesses.filter((access) => access.status === "active").length;
    return { income, pending, delivered, activeAccesses };
  }, [orders, accesses]);

  const updateOrderStatus = async (orderId, status) => {
    if (statusBusy) return;
    setStatusBusy(orderId);
    setMessage("");

    const { data, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id, status, total, currency, payment_method, notes, created_at, updated_at, user_id, profiles(id, full_name), order_items(id, product_name, plan_name, duration, price)")
      .single();

    if (error) {
      setMessage("No pudimos actualizar el pedido. Revisa las políticas de administrador.");
    } else {
      setOrders((current) => current.map((order) => order.id === orderId ? data : order));
      setMessage("Pedido actualizado correctamente.");
    }

    setStatusBusy(null);
  };

  const resetCatalogForm = () => {
    setCatalogEditing(null);
    setCatalogForm({ name: "", category: "Inteligencia Artificial", description: "", price: "", active: true, logoFile: null, logoUrl: "" });
    setCatalogFormOpen(false);
  };

  const openCatalogCreate = () => {
    setCatalogEditing(null);
    setCatalogForm({ name: "", category: "Inteligencia Artificial", description: "", price: "", active: true, logoFile: null, logoUrl: "" });
    setCatalogFormOpen(true);
  };

  const openCatalogEdit = (product) => {
    setCatalogEditing(product);
    setCatalogForm({ name: product.name || "", category: product.category || "Inteligencia Artificial", description: product.description || "", price: product.price_from ? String(product.price_from) : "", active: product.active !== false, logoFile: null, logoUrl: product.logo_url || "" });
    setCatalogFormOpen(true);
  };

  const saveCatalogProduct = async (event) => {
    event.preventDefault();
    if (catalogSaving || !catalogForm.name.trim()) return;
    setCatalogSaving(true);
    setMessage("");
    try {
      let logoUrl = catalogForm.logoUrl || "";
      if (catalogForm.logoFile) {
        const safeName = catalogForm.logoFile.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
        const path = Date.now() + "-" + safeName;
        const { error: uploadError } = await supabase.storage.from("product-logos").upload(path, catalogForm.logoFile, { upsert: true, contentType: catalogForm.logoFile.type || "image/png" });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from("product-logos").getPublicUrl(path);
        logoUrl = publicData.publicUrl;
      }
      const payload = {
        name: catalogForm.name.trim(),
        category: catalogForm.category,
        description: catalogForm.description.trim(),
        logo_url: logoUrl,
        price_from: Number(catalogForm.price) || 0,
        active: Boolean(catalogForm.active),
        updated_at: new Date().toISOString(),
      };
      if (catalogEditing) {
        const { error } = await supabase.from("products").update(payload).eq("id", catalogEditing.id);
        if (error) throw error;
        setMessage("Producto actualizado correctamente.");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        setMessage("Producto creado correctamente.");
      }
      resetCatalogForm();
      await loadCatalog();
    } catch (error) {
      setMessage(error?.message || "No pudimos guardar el producto.");
    } finally {
      setCatalogSaving(false);
    }
  };

  const deleteCatalogProduct = async (product) => {
    if (!window.confirm("¿Eliminar " + product.name + " del catálogo?")) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) setMessage(error.message || "No pudimos eliminar el producto.");
    else {
      setMessage("Producto eliminado.");
      await loadCatalog();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!session) {
    return (
      <main className="admin-shell">
        <section className="admin-gate">
          <div className="admin-gate-orb">V</div>
          <span className="admin-kicker">VEXORA / CONTROL</span>
          <h1>Necesitas iniciar sesión.</h1>
          <p>Entra desde la experiencia principal de VEXORA para acceder al panel.</p>
          <a href="/" className="admin-primary">Volver a VEXORA ↗</a>
        </section>
      </main>
    );
  }

  if (!loading && profile?.role !== "admin") {
    return (
      <main className="admin-shell">
        <section className="admin-gate">
          <div className="admin-gate-orb">V</div>
          <span className="admin-kicker">ACCESO RESTRINGIDO</span>
          <h1>Este espacio es privado.</h1>
          <p>Tu cuenta está autenticada, pero no tiene permisos de administrador.</p>
          <div className="admin-gate-actions">
            <a href="/" className="admin-primary">Volver a VEXORA ↗</a>
            <button type="button" className="admin-secondary" onClick={signOut}>Cerrar sesión</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-ambient admin-ambient-a" />
      <div className="admin-ambient admin-ambient-b" />

      <header className="admin-topbar">
        <a href="/" className="admin-brand">
          <span className="admin-brand-orb">V</span>
          <span><strong>VEXORA</strong><small>CONTROL CENTER</small></span>
        </a>
        <div className="admin-top-actions">
          <span className="admin-live"><i /> SISTEMA ONLINE</span>
          <div className="admin-user">
            <span>{(profile?.full_name || "A").charAt(0).toUpperCase()}</span>
            <div><strong>{profile?.full_name || "Administrador"}</strong><small>ADMIN</small></div>
          </div>
          <button type="button" className="admin-icon-button" onClick={signOut} aria-label="Cerrar sesión">↗</button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-side-heading">OPERACIONES</div>
          <nav className="admin-nav" aria-label="Panel de administración">
            {tabs.map(([id, label, icon]) => (
              <button
                type="button"
                key={id}
                className={tab === id ? "admin-nav-item active" : "admin-nav-item"}
                onClick={() => setTab(id)}
              >
                <span>{icon}</span><b>{label}</b>{tab === id && <i />}
              </button>
            ))}
          </nav>
          <div className="admin-side-note">
            <span>VEXORA OS</span>
            <small>Gestión de operaciones digitales.</small>
          </div>
        </aside>

        <section className="admin-content">
          <div className="admin-mobile-nav">
            {tabs.map(([id, label, icon]) => (
              <button type="button" key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          <div className="admin-page-head">
            <div>
              <span className="admin-kicker">CONTROL CENTER / {tab.toUpperCase()}</span>
              <h1>{tabs.find((item) => item[0] === tab)?.[1] || "Resumen"}</h1>
              <p>Gestiona VEXORA con la misma experiencia premium, fluida y cinematográfica.</p>
            </div>
            <button type="button" className="admin-refresh" onClick={() => session?.user && loadAdmin(session.user.id)}>↻ Actualizar</button>
          </div>

          {message && <div className="admin-message" role="status">{message}</div>}

          {loading ? (
            <div className="admin-loading"><span className="admin-spinner" /> Cargando operaciones...</div>
          ) : (
            <>
              {tab === "overview" && (
                <section className="admin-view">
                  <div className="admin-stat-grid">
                    <article className="admin-stat"><span>INGRESOS</span><strong>S/{stats.income.toFixed(2)}</strong><small>Pedidos no cancelados</small></article>
                    <article className="admin-stat"><span>PEDIDOS</span><strong>{orders.length}</strong><small>{stats.pending} pendientes</small></article>
                    <article className="admin-stat"><span>CLIENTES</span><strong>{customers.length}</strong><small>Cuentas registradas</small></article>
                    <article className="admin-stat"><span>ENTREGADOS</span><strong>{stats.delivered}</strong><small>{stats.activeAccesses} accesos activos</small></article>
                  </div>

                  <div className="admin-grid-two">
                    <section className="admin-panel">
                      <div className="admin-panel-head"><div><span>ACTIVIDAD</span><h2>Pedidos recientes</h2></div><button type="button" onClick={() => setTab("orders")}>Ver todos ↗</button></div>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead><tr><th>Pedido</th><th>Cliente</th><th>Plan</th><th>Total</th><th>Estado</th></tr></thead>
                          <tbody>
                            {orders.slice(0, 6).map((order) => {
                              const item = order.order_items?.[0];
                              return (
                                <tr key={order.id}>
                                  <td><strong>VEX-{order.id.slice(0, 8).toUpperCase()}</strong><small>{new Date(order.created_at).toLocaleDateString("es-PE")}</small></td>
                                  <td>{order.profiles?.full_name || "Sin nombre"}</td>
                                  <td>{item?.product_name || "—"}<small>{item?.plan_name || "—"}</small></td>
                                  <td>S/{Number(order.total || 0).toFixed(2)}</td>
                                  <td><span className={"admin-status status-" + order.status}>{statusLabels[order.status] || order.status}</span></td>
                                </tr>
                              );
                            })}
                            {!orders.length && <tr><td colSpan="5" className="admin-empty">Aún no hay pedidos.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="admin-panel admin-cinematic-panel">
                      <div className="admin-panel-glow" />
                      <span className="admin-panel-kicker">VEXORA SYSTEM</span>
                      <h2>Todo bajo control.</h2>
                      <p>Pedidos, clientes y accesos en un solo centro de operaciones.</p>
                      <div className="admin-orbit-art"><span>V</span><i /><i /><i /></div>
                    </section>
                  </div>
                </section>
              )}

              {tab === "orders" && (
                <section className="admin-panel">
                  <div className="admin-panel-head"><div><span>GESTIÓN</span><h2>Todos los pedidos</h2></div><strong className="admin-count">{orders.length} registros</strong></div>
                  <div className="admin-orders-list">
                    {orders.map((order) => {
                      const item = order.order_items?.[0];
                      return (
                        <article className="admin-order-card" key={order.id}>
                          <div className="admin-order-main">
                            <div className="admin-order-id"><span>VEX-{order.id.slice(0, 8).toUpperCase()}</span><small>{new Date(order.created_at).toLocaleString("es-PE")}</small></div>
                            <h3>{item?.product_name || "Pedido VEXORA"} — {item?.plan_name || "Acceso digital"}</h3>
                            <p>{order.profiles?.full_name || "Cliente sin nombre"} · {item?.duration || "—"}</p>
                          </div>
                          <div className="admin-order-side">
                            <strong>S/{Number(order.total || 0).toFixed(2)}</strong>
                            <select value={order.status} disabled={statusBusy === order.id} onChange={(event) => updateOrderStatus(order.id, event.target.value)} aria-label={"Estado del pedido VEX-" + order.id.slice(0, 8).toUpperCase()}>
                              <option value="pending">Pendiente</option>
                              <option value="confirmed">Confirmado</option>
                              <option value="delivered">Entregado</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                          </div>
                        </article>
                      );
                    })}
                    {!orders.length && <div className="admin-empty-block">No hay pedidos todavía.</div>}
                  </div>
                </section>
              )}

              {tab === "customers" && (
                <section className="admin-panel">
                  <div className="admin-panel-head"><div><span>CRM</span><h2>Clientes VEXORA</h2></div><strong className="admin-count">{customers.length} cuentas</strong></div>
                  <div className="admin-customer-grid">
                    {customers.map((customer) => (
                      <article className="admin-customer-card" key={customer.id}>
                        <span className="admin-customer-avatar">{(customer.full_name || "V").charAt(0).toUpperCase()}</span>
                        <div><strong>{customer.full_name || "Sin nombre"}</strong><small>{customer.role === "admin" ? "Administrador" : "Cliente"}</small><small>Desde {new Date(customer.created_at).toLocaleDateString("es-PE")}</small></div>
                        <span className={"admin-role " + customer.role}>{customer.role}</span>
                      </article>
                    ))}
                    {!customers.length && <div className="admin-empty-block">No hay clientes registrados.</div>}
                  </div>
                </section>
              )}

              {tab === "catalog" && (
                <section className="admin-panel">
                  <div className="admin-panel-head">
                    <div><span>CATÁLOGO</span><h2>Servicios publicados</h2></div>
                    <div className="admin-catalog-actions"><strong className="admin-count">{products.length} productos</strong><button type="button" className="admin-primary admin-catalog-add" onClick={openCatalogCreate}>＋ Nuevo producto</button></div>
                  </div>
                  {catalogLoading ? (
                    <div className="admin-loading"><span className="admin-spinner" /> Cargando catálogo...</div>
                  ) : (
                    <div className="admin-catalog-grid">
                      {products.map((product) => (
                        <article className="admin-catalog-card" key={product.id}>
                          <div className="admin-catalog-orb">{product.logo_url ? <img src={product.logo_url} alt="" /> : product.name.charAt(0)}</div>
                          <div><span>{product.category}</span><strong>{product.name}</strong><small>{product.price_from ? "Desde S/" + Number(product.price_from).toFixed(2) : "Precio por definir"}</small></div>
                          <div className="admin-catalog-card-actions">
                            <button type="button" onClick={() => openCatalogEdit(product)}>Editar</button>
                            <button type="button" onClick={() => deleteCatalogProduct(product)}>Eliminar</button>
                          </div>
                        </article>
                      ))}
                      {!products.length && <div className="admin-empty-block">No hay productos todavía. Crea el primero con “Nuevo producto”.</div>}
                    </div>
                  )}
                  {catalogFormOpen && (
                    <form className="admin-catalog-form" onSubmit={saveCatalogProduct}>
                      <div className="admin-catalog-form-head"><div><span>{catalogEditing ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}</span><h3>{catalogEditing ? catalogEditing.name : "Agregar al catálogo"}</h3></div><button type="button" className="admin-icon-button" onClick={resetCatalogForm}>×</button></div>
                      <div className="admin-catalog-form-grid">
                        <label><span>Nombre</span><input required value={catalogForm.name} onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })} placeholder="Disney+" /></label>
                        <label><span>Categoría</span><select value={catalogForm.category} onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}><option>Inteligencia Artificial</option><option>Streaming</option><option>Gaming</option><option>Productividad</option><option>Diseño</option><option>Software</option><option>Otros</option></select></label>
                        <label><span>Precio desde (S/)</span><input type="number" min="0" step="0.01" value={catalogForm.price} onChange={(e) => setCatalogForm({ ...catalogForm, price: e.target.value })} placeholder="25" /></label>
                        <label className="admin-catalog-full"><span>Descripción</span><textarea value={catalogForm.description} onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })} placeholder="Describe brevemente el servicio." rows="3" /></label>
                        <label className="admin-catalog-full"><span>Logo del producto</span><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => setCatalogForm({ ...catalogForm, logoFile: e.target.files?.[0] || null })} /><small>PNG, JPG, WEBP o SVG · recomendado: fondo transparente.</small></label>
                        <label className="admin-switch-row"><input type="checkbox" checked={catalogForm.active} onChange={(e) => setCatalogForm({ ...catalogForm, active: e.target.checked })} /><span>Producto visible en VEXORA</span></label>
                      </div>
                      {catalogForm.logoFile && <div className="admin-logo-preview"><img src={URL.createObjectURL(catalogForm.logoFile)} alt="Vista previa del logo" /></div>}
                      <div className="admin-catalog-form-actions"><button type="button" className="admin-secondary" onClick={resetCatalogForm}>Cancelar</button><button type="submit" className="admin-primary" disabled={catalogSaving}>{catalogSaving ? "Guardando..." : "Guardar producto"}</button></div>
                    </form>
                  )}
                  <div className="admin-info-callout"><span>CATÁLOGO DINÁMICO</span><strong>Ahora puedes agregar nuevos servicios sin tocar el código.</strong><p>Sube el logo, define categoría, descripción y precio. Los datos quedan guardados en Supabase para que después podamos conectarlos automáticamente a la tienda.</p></div>
                </section>
              )}

              {tab === "accesses" && (
                <section className="admin-panel">
                  <div className="admin-panel-head"><div><span>ENTREGAS</span><h2>Accesos registrados</h2></div><strong className="admin-count">{accesses.length} accesos</strong></div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>Servicio</th><th>Tipo</th><th>Usuario</th><th>2FA</th><th>Estado</th><th>Vencimiento</th></tr></thead>
                      <tbody>
                        {accesses.map((access) => (
                          <tr key={access.id}>
                            <td><strong>{access.order_items?.product_name || "—"}</strong><small>{access.order_items?.plan_name || "—"}</small></td>
                            <td>{access.access_type}</td>
                            <td>{access.email || access.username || "—"}</td>
                            <td>{access.two_factor_enabled ? "Sí" : "No"}</td>
                            <td><span className={"admin-status status-" + access.status}>{access.status}</span></td>
                            <td>{access.expires_at ? new Date(access.expires_at).toLocaleDateString("es-PE") : "—"}</td>
                          </tr>
                        ))}
                        {!accesses.length && <tr><td colSpan="6" className="admin-empty">Aún no hay accesos registrados.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
