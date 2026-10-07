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

const prepareLogoForUpload = async (file) => {
  if (!file) return null;
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No pudimos leer el logo seleccionado."));
      img.src = sourceUrl;
    });
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) throw new Error("El logo no tiene dimensiones válidas.");
    const maxSize = 1800;
    const scale = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Tu navegador no permite procesar el logo.");
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const total = width * height;
    const background = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;
    const pixelIndex = (x, y) => y * width + x;

    const isBrightNeutral = (index) => {
      const i = index * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
      return a > 0 && r >= 228 && g >= 228 && b >= 228 && Math.max(r, g, b) - Math.min(r, g, b) <= 24;
    };

    const cornerIndexes = [
      pixelIndex(0, 0), pixelIndex(width - 1, 0),
      pixelIndex(0, height - 1), pixelIndex(width - 1, height - 1)
    ];
    const brightCorners = cornerIndexes.filter(isBrightNeutral);

    // Canva may export a transparency preview as a baked dark/checkerboard background.
    // Detect it from the corners and from the dominance of dark neutral pixels.
    const cornerSamples = cornerIndexes.map((index) => {
      const i = index * 4;
      return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    });

    const isDarkNeutral = (r, g, b, a) =>
      a > 0 &&
      Math.max(r, g, b) - Math.min(r, g, b) <= 28 &&
      (r + g + b) / 3 < 125;

    const darkNeutralCorners = cornerSamples.filter(([r, g, b, a]) => isDarkNeutral(r, g, b, a));
    let darkNeutralCount = 0;

    for (let index = 0; index < total; index += 1) {
      const i = index * 4;
      if (isDarkNeutral(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3])) {
        darkNeutralCount += 1;
      }
    }

    // If most of the image is dark neutral and the corners are dark, treat that
    // tone as the baked background. Remove it globally so enclosed areas such
    // as the inside of the Disney+ arc also become truly transparent.
    if (darkNeutralCorners.length >= 3 && darkNeutralCount / total > 0.55) {
      const seed = cornerSamples.find(([r, g, b, a]) => isDarkNeutral(r, g, b, a)) || [0, 0, 0, 255];
      const sr = seed[0], sg = seed[1], sb = seed[2];

      for (let index = 0; index < total; index += 1) {
        const i = index * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
        if (
          a > 0 &&
          Math.max(r, g, b) - Math.min(r, g, b) <= 34 &&
          Math.max(Math.abs(r - sr), Math.abs(g - sg), Math.abs(b - sb)) <= 70
        ) {
          pixels[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    if (brightCorners.length >= 2) {
      const seed = brightCorners[0] * 4;
      const sr = pixels[seed], sg = pixels[seed + 1], sb = pixels[seed + 2];
      const canRemove = (index) => {
        const i = index * 4;
        const alpha = pixels[i + 3];
        return alpha > 0 &&
          Math.max(Math.abs(pixels[i] - sr), Math.abs(pixels[i + 1] - sg), Math.abs(pixels[i + 2] - sb)) <= 42;
      };
      const enqueue = (index) => {
        if (background[index]) return;
        background[index] = 1;
        queue[tail++] = index;
      };

      for (let x = 0; x < width; x += 1) {
        const top = pixelIndex(x, 0), bottom = pixelIndex(x, height - 1);
        if (canRemove(top)) enqueue(top);
        if (canRemove(bottom)) enqueue(bottom);
      }
      for (let y = 0; y < height; y += 1) {
        const left = pixelIndex(0, y), right = pixelIndex(width - 1, y);
        if (canRemove(left)) enqueue(left);
        if (canRemove(right)) enqueue(right);
      }

      while (head < tail) {
        const index = queue[head++];
        const x = index % width, y = Math.floor(index / width);
        const neighbors = [
          x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1,
          y > 0 ? index - width : -1, y < height - 1 ? index + width : -1
        ];
        for (const neighbor of neighbors) {
          if (neighbor >= 0 && !background[neighbor] && canRemove(neighbor)) enqueue(neighbor);
        }
      }

      for (let index = 0; index < total; index += 1) {
        if (background[index]) pixels[index * 4 + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("No pudimos preparar el logo.");
    return blob;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderAccesses, setOrderAccesses] = useState([]);
  const [orderAccessesLoading, setOrderAccessesLoading] = useState(false);
  const [orderAccessModalOpen, setOrderAccessModalOpen] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessEditing, setAccessEditing] = useState(null);
  const [accessForm, setAccessForm] = useState({
    access_type: "cuenta",
    email: "",
    username: "",
    password: "",
    two_factor_enabled: false,
    status: "active",
    starts_at: "",
    expires_at: "",
    notes: "",
  });
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogFormOpen, setCatalogFormOpen] = useState(false);
  const [catalogEditing, setCatalogEditing] = useState(null);
  const [catalogForm, setCatalogForm] = useState({ name: "", category: "Inteligencia Artificial", description: "", price: "", active: true, logoFile: null, logoUrl: "" });
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [plansProduct, setPlansProduct] = useState(null);
  const [planEditing, setPlanEditing] = useState(null);
  const [planForm, setPlanForm] = useState({ name: "", duration: "1 mes", price: "", description: "", active: true, sort_order: 0 });
  const [benefits, setBenefits] = useState([]);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [benefitSaving, setBenefitSaving] = useState(false);
  const [benefitEditing, setBenefitEditing] = useState(null);
  const [benefitForm, setBenefitForm] = useState({ text: "", active: true, sort_order: 0 });

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

  const loadPlans = async (productId) => {
    if (!productId) return;
    setPlansLoading(true);
    const { data, error } = await supabase
      .from("product_plans")
      .select("id, product_id, name, duration, price, description, active, sort_order, created_at, updated_at")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      setMessage("No pudimos cargar los planes. Verifica que ejecutaste el SQL de planes en Supabase.");
      setPlans([]);
    } else {
      setPlans(data || []);
    }
    setPlansLoading(false);
  };

  const loadBenefits = async (productId) => {
    if (!productId) return;
    setBenefitsLoading(true);
    const { data, error } = await supabase
      .from("product_benefits")
      .select("id, product_id, text, active, sort_order, created_at, updated_at")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      setMessage("No pudimos cargar los beneficios. Ejecuta primero el SQL de beneficios en Supabase.");
      setBenefits([]);
    } else {
      setBenefits(data || []);
    }
    setBenefitsLoading(false);
  };

  const openPlansManager = async (product) => {
    setPlansProduct(product);
    setPlanEditing(null);
    setPlanForm({ name: "", duration: "1 mes", price: "", description: "", active: true, sort_order: 0 });
    setBenefitEditing(null);
    setBenefitForm({ text: "", active: true, sort_order: 0 });
    await Promise.all([loadPlans(product.id), loadBenefits(product.id)]);
  };

  const closePlansManager = () => {
    setPlansProduct(null);
    setPlanEditing(null);
    setPlans([]);
    setBenefitEditing(null);
    setBenefits([]);
  };

  const startPlanCreate = () => {
    setPlanEditing(null);
    setPlanForm({ name: "", duration: "1 mes", price: "", description: "", active: true, sort_order: plans.length });
  };

  const startPlanEdit = (plan) => {
    setPlanEditing(plan);
    setPlanForm({
      name: plan.name || "",
      duration: plan.duration || "1 mes",
      price: plan.price == null ? "" : String(plan.price),
      description: plan.description || "",
      active: plan.active !== false,
      sort_order: Number.isFinite(Number(plan.sort_order)) ? Number(plan.sort_order) : 0,
    });
  };

  const savePlan = async (event) => {
    event.preventDefault();
    if (!plansProduct || planSaving || !planForm.name.trim()) return;
    const price = Number(planForm.price);
    if (!Number.isFinite(price) || price < 0) {
      setMessage("Ingresa un precio válido para el plan.");
      return;
    }
    setPlanSaving(true);
    setMessage("");
    try {
      const payload = {
        product_id: plansProduct.id,
        name: planForm.name.trim(),
        duration: planForm.duration.trim(),
        price,
        description: planForm.description.trim(),
        active: Boolean(planForm.active),
        sort_order: Math.max(0, Number(planForm.sort_order) || 0),
        updated_at: new Date().toISOString(),
      };
      if (planEditing) {
        const { error } = await supabase.from("product_plans").update(payload).eq("id", planEditing.id);
        if (error) throw error;
        setMessage("Plan actualizado correctamente.");
      } else {
        const { error } = await supabase.from("product_plans").insert(payload);
        if (error) throw error;
        setMessage("Plan creado correctamente.");
      }
      startPlanCreate();
      await loadPlans(plansProduct.id);
    } catch (error) {
      setMessage(error?.message || "No pudimos guardar el plan.");
    } finally {
      setPlanSaving(false);
    }
  };

  const deletePlan = async (plan) => {
    if (!window.confirm("¿Eliminar el plan " + plan.name + "?")) return;
    const { error } = await supabase.from("product_plans").delete().eq("id", plan.id);
    if (error) {
      setMessage(error.message || "No pudimos eliminar el plan.");
    } else {
      setMessage("Plan eliminado.");
      await loadPlans(plansProduct.id);
    }
  };

  const startBenefitCreate = () => {
    setBenefitEditing(null);
    setBenefitForm({ text: "", active: true, sort_order: benefits.length });
  };

  const startBenefitEdit = (benefit) => {
    setBenefitEditing(benefit);
    setBenefitForm({
      text: benefit.text || "",
      active: benefit.active !== false,
      sort_order: Number.isFinite(Number(benefit.sort_order)) ? Number(benefit.sort_order) : 0,
    });
  };

  const saveBenefit = async (event) => {
    event.preventDefault();
    if (!plansProduct || benefitSaving || !benefitForm.text.trim()) return;
    setBenefitSaving(true);
    setMessage("");
    try {
      const payload = {
        product_id: plansProduct.id,
        text: benefitForm.text.trim(),
        active: Boolean(benefitForm.active),
        sort_order: Math.max(0, Number(benefitForm.sort_order) || 0),
        updated_at: new Date().toISOString(),
      };
      if (benefitEditing) {
        const { error } = await supabase.from("product_benefits").update(payload).eq("id", benefitEditing.id);
        if (error) throw error;
        setMessage("Beneficio actualizado correctamente.");
      } else {
        const { error } = await supabase.from("product_benefits").insert(payload);
        if (error) throw error;
        setMessage("Beneficio creado correctamente.");
      }
      startBenefitCreate();
      await loadBenefits(plansProduct.id);
    } catch (error) {
      setMessage(error?.message || "No pudimos guardar el beneficio.");
    } finally {
      setBenefitSaving(false);
    }
  };

  const deleteBenefit = async (benefit) => {
    if (!window.confirm("¿Eliminar este beneficio?")) return;
    const { error } = await supabase.from("product_benefits").delete().eq("id", benefit.id);
    if (error) {
      setMessage(error.message || "No pudimos eliminar el beneficio.");
    } else {
      setMessage("Beneficio eliminado.");
      await loadBenefits(plansProduct.id);
    }
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

  const emptyAccessForm = () => ({
    access_type: "cuenta",
    email: "",
    username: "",
    password: "",
    two_factor_enabled: false,
    status: "active",
    starts_at: "",
    expires_at: "",
    notes: "",
  });

  const toDateTimeLocal = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  };

  const loadOrderAccesses = async (orderItemId) => {
    if (!orderItemId) {
      setOrderAccesses([]);
      return;
    }
    setOrderAccessesLoading(true);
    const { data, error } = await supabase
      .from("accesses")
      .select("id, order_item_id, access_type, email, username, password, two_factor_enabled, notes, status, starts_at, expires_at, created_at")
      .eq("order_item_id", orderItemId)
      .order("created_at", { ascending: false });
    if (error) {
      setMessage("No pudimos cargar los accesos de este pedido.");
      setOrderAccesses([]);
    } else {
      setOrderAccesses(data || []);
    }
    setOrderAccessesLoading(false);
  };

  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    setOrderAccessModalOpen(true);
    setAccessEditing(null);
    setAccessForm(emptyAccessForm());
    await loadOrderAccesses(order.order_items?.[0]?.id);
  };

  const closeOrderDetail = () => {
    setOrderAccessModalOpen(false);
    setSelectedOrder(null);
    setOrderAccesses([]);
    setAccessEditing(null);
    setAccessForm(emptyAccessForm());
  };

  const startAccessCreate = () => {
    const item = selectedOrder?.order_items?.[0];
    setAccessEditing(null);
    setAccessForm({
      ...emptyAccessForm(),
      notes: item ? "Entrega correspondiente a " + (item.product_name || "este pedido") + "." : "",
    });
  };

  const startAccessEdit = (access) => {
    setAccessEditing(access);
    setAccessForm({
      access_type: access.access_type || "cuenta",
      email: access.email || "",
      username: access.username || "",
      password: access.password || "",
      two_factor_enabled: Boolean(access.two_factor_enabled),
      status: access.status || "active",
      starts_at: toDateTimeLocal(access.starts_at),
      expires_at: toDateTimeLocal(access.expires_at),
      notes: access.notes || "",
    });
  };

  const saveAccess = async (event) => {
    event.preventDefault();
    if (!selectedOrder || accessSaving) return;
    const orderItemId = selectedOrder.order_items?.[0]?.id;
    if (!orderItemId) {
      setMessage("Este pedido no tiene un producto asociado.");
      return;
    }

    if (!accessForm.email.trim() && !accessForm.username.trim()) {
      setMessage("Ingresa un correo o usuario para registrar el acceso.");
      return;
    }

    const startsAt = accessForm.starts_at ? new Date(accessForm.starts_at).toISOString() : null;
    const expiresAt = accessForm.expires_at ? new Date(accessForm.expires_at).toISOString() : null;

    if (startsAt && expiresAt && new Date(expiresAt) < new Date(startsAt)) {
      setMessage("La fecha de vencimiento no puede ser anterior al inicio.");
      return;
    }

    setAccessSaving(true);
    setMessage("");

    try {
      const payload = {
        order_item_id: orderItemId,
        access_type: accessForm.access_type.trim() || "cuenta",
        email: accessForm.email.trim() || null,
        username: accessForm.username.trim() || null,
        password: accessForm.password || null,
        two_factor_enabled: Boolean(accessForm.two_factor_enabled),
        status: accessForm.status,
        starts_at: startsAt,
        expires_at: expiresAt,
        notes: accessForm.notes.trim() || null,
      };

      if (accessEditing) {
        const { data, error } = await supabase
          .from("accesses")
          .update(payload)
          .eq("id", accessEditing.id)
          .select("id, order_item_id, access_type, email, username, password, two_factor_enabled, notes, status, starts_at, expires_at, created_at")
          .single();
        if (error) throw error;
        setOrderAccesses((current) => current.map((access) => access.id === data.id ? data : access));
        setAccessEditing(null);
        setMessage("Acceso actualizado correctamente.");
      } else {
        const { data, error } = await supabase
          .from("accesses")
          .insert(payload)
          .select("id, order_item_id, access_type, email, username, password, two_factor_enabled, notes, status, starts_at, expires_at, created_at")
          .single();
        if (error) throw error;
        setOrderAccesses((current) => [data, ...current]);
        setMessage("Acceso registrado correctamente.");
      }

      setAccessForm(emptyAccessForm());
      const { data: refreshedAccesses } = await supabase
        .from("accesses")
        .select("id, order_item_id, access_type, email, username, password, two_factor_enabled, notes, status, starts_at, expires_at, created_at")
        .eq("order_item_id", orderItemId)
        .order("created_at", { ascending: false });
      setOrderAccesses(refreshedAccesses || []);
      await loadAdmin(session?.user?.id);
    } catch (error) {
      setMessage(error?.message || "No pudimos guardar el acceso.");
    } finally {
      setAccessSaving(false);
    }
  };

  const deleteAccess = async (access) => {
    if (!window.confirm("¿Eliminar este acceso registrado?")) return;
    const { error } = await supabase.from("accesses").delete().eq("id", access.id);
    if (error) {
      setMessage(error.message || "No pudimos eliminar el acceso.");
      return;
    }
    setOrderAccesses((current) => current.filter((item) => item.id !== access.id));
    setAccessEditing(null);
    setAccessForm(emptyAccessForm());
    setMessage("Acceso eliminado.");
  };

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
        const preparedLogo = await prepareLogoForUpload(catalogForm.logoFile);
        const baseName = catalogForm.logoFile.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "logo";
        const path = Date.now() + "-" + baseName + ".png";
        const { error: uploadError } = await supabase.storage
          .from("product-logos")
          .upload(path, preparedLogo, { upsert: true, contentType: "image/png", cacheControl: "31536000" });
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
                        <article className="admin-order-card" key={order.id} onDoubleClick={() => openOrderDetail(order)}>
                          <div className="admin-order-main">
                            <div className="admin-order-id"><span>VEX-{order.id.slice(0, 8).toUpperCase()}</span><small>{new Date(order.created_at).toLocaleString("es-PE")}</small></div>
                            <h3>{item?.product_name || "Pedido VEXORA"} — {item?.plan_name || "Acceso digital"}</h3>
                            <p>{order.profiles?.full_name || "Cliente sin nombre"} · {item?.duration || "—"}</p>
                          </div>
                          <div className="admin-order-side">
                             <button type="button" className="admin-order-detail-button" onClick={() => openOrderDetail(order)}>Detalle ↗</button>
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
                            <button type="button" onClick={() => openPlansManager(product)}>Gestionar</button>
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
                  {plansProduct && (
                    <div className="admin-plans-overlay" role="dialog" aria-modal="true" aria-label={"Planes de " + plansProduct.name}>
                      <section className="admin-plans-modal">
                        <div className="admin-plans-head">
                          <div>
                            <span>GESTIÓN DE PLANES</span>
                            <h3>{plansProduct.name}</h3>
                            <p>{plansProduct.category} · precios y condiciones publicados</p>
                          </div>
                          <button type="button" className="admin-icon-button" onClick={closePlansManager}>×</button>
                        </div>
                        <div className="admin-plans-body">
                          <div className="admin-plans-list">
                            <div className="admin-plans-list-head"><strong>{plans.length} planes</strong><button type="button" className="admin-primary" onClick={startPlanCreate}>＋ Nuevo plan</button></div>
                            {plansLoading ? (
                              <div className="admin-loading"><span className="admin-spinner" /> Cargando planes...</div>
                            ) : plans.length ? (
                              plans.map((plan) => (
                                <article className="admin-plan-card" key={plan.id}>
                                  <div><span className={plan.active ? "admin-plan-active" : "admin-plan-inactive"}>{plan.active ? "ACTIVO" : "OCULTO"}</span><strong>{plan.name}</strong><small>{plan.duration} · {plan.description || "Sin descripción"}</small></div>
                                  <b>S/{Number(plan.price || 0).toFixed(2)}</b>
                                  <div className="admin-plan-actions"><button type="button" onClick={() => startPlanEdit(plan)}>Editar</button><button type="button" onClick={() => deletePlan(plan)}>Eliminar</button></div>
                                </article>
                              ))
                            ) : <div className="admin-empty-block">Este producto todavía no tiene planes.</div>}
                          </div>
                          <form className="admin-plan-form" onSubmit={savePlan}>
                            <div><span>{planEditing ? "EDITAR PLAN" : "NUEVO PLAN"}</span><h4>{planEditing ? planEditing.name : "Agregar plan"}</h4></div>
                            <label><span>Nombre del plan</span><input required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Premium" /></label>
                            <label><span>Duración</span><input value={planForm.duration} onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })} placeholder="1 mes" /></label>
                            <label><span>Precio (S/)</span><input required type="number" min="0" step="0.01" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} placeholder="25" /></label>
                            <label><span>Descripción / condiciones</span><textarea rows="4" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Describe qué incluye el plan." /></label>
                            <label><span>Orden</span><input type="number" min="0" step="1" value={planForm.sort_order} onChange={(e) => setPlanForm({ ...planForm, sort_order: e.target.value })} /></label>
                            <label className="admin-switch-row"><input type="checkbox" checked={planForm.active} onChange={(e) => setPlanForm({ ...planForm, active: e.target.checked })} /><span>Plan visible en VEXORA</span></label>
                            <div className="admin-plan-form-actions">{planEditing && <button type="button" className="admin-secondary" onClick={startPlanCreate}>Cancelar edición</button>}<button type="submit" className="admin-primary" disabled={planSaving}>{planSaving ? "Guardando..." : planEditing ? "Guardar cambios" : "Crear plan"}</button></div>
                          </form>
                        </div>

                        <div className="admin-benefits-section">
                          <div className="admin-benefits-list">
                            <div className="admin-plans-list-head">
                              <div>
                                <strong>Beneficios de la plataforma</strong>
                                <small className="admin-benefits-subtitle">Se muestran como ventajas generales del servicio.</small>
                              </div>
                              <button type="button" className="admin-primary" onClick={startBenefitCreate}>＋ Nuevo beneficio</button>
                            </div>
                            {benefitsLoading ? (
                              <div className="admin-loading"><span className="admin-spinner" /> Cargando beneficios...</div>
                            ) : benefits.length ? (
                              benefits.map((benefit, index) => (
                                <article className="admin-benefit-card" key={benefit.id}>
                                  <div className="admin-benefit-number">{index + 1}</div>
                                  <div className="admin-benefit-copy">
                                    <span className={benefit.active ? "admin-plan-active" : "admin-plan-inactive"}>{benefit.active ? "ACTIVO" : "OCULTO"}</span>
                                    <strong>{benefit.text}</strong>
                                  </div>
                                  <div className="admin-plan-actions">
                                    <button type="button" onClick={() => startBenefitEdit(benefit)}>Editar</button>
                                    <button type="button" onClick={() => deleteBenefit(benefit)}>Eliminar</button>
                                  </div>
                                </article>
                              ))
                            ) : (
                              <div className="admin-empty-block">Este producto todavía no tiene beneficios.</div>
                            )}
                          </div>

                          <form className="admin-benefit-form" onSubmit={saveBenefit}>
                            <div>
                              <span>{benefitEditing ? "EDITAR BENEFICIO" : "NUEVO BENEFICIO"}</span>
                              <h4>{benefitEditing ? "Actualizar ventaja" : "Agregar beneficio"}</h4>
                            </div>
                            <label>
                              <span>Beneficio</span>
                              <textarea
                                required
                                rows="3"
                                value={benefitForm.text}
                                onChange={(e) => setBenefitForm({ ...benefitForm, text: e.target.value })}
                                placeholder="Contenido exclusivo y actualizado."
                              />
                            </label>
                            <label>
                              <span>Orden</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={benefitForm.sort_order}
                                onChange={(e) => setBenefitForm({ ...benefitForm, sort_order: e.target.value })}
                              />
                            </label>
                            <label className="admin-switch-row">
                              <input
                                type="checkbox"
                                checked={benefitForm.active}
                                onChange={(e) => setBenefitForm({ ...benefitForm, active: e.target.checked })}
                              />
                              <span>Beneficio visible en VEXORA</span>
                            </label>
                            <div className="admin-plan-form-actions">
                              {benefitEditing && <button type="button" className="admin-secondary" onClick={startBenefitCreate}>Cancelar edición</button>}
                              <button type="submit" className="admin-primary" disabled={benefitSaving}>
                                {benefitSaving ? "Guardando..." : benefitEditing ? "Guardar cambios" : "Crear beneficio"}
                              </button>
                            </div>
                          </form>
                        </div>
                      </section>
                    </div>
                  )}
                  <div className="admin-info-callout"><span>CATÁLOGO DINÁMICO</span><strong>Ahora puedes agregar nuevos servicios sin tocar el código.</strong><p>Sube el logo, define categoría, descripción y precio. Los datos quedan guardados en Supabase para que después podamos conectarlos automáticamente a la tienda.</p></div>
                </section>
              )}

              {orderAccessModalOpen && selectedOrder && (
                <div className="admin-order-modal-overlay" role="dialog" aria-modal="true" aria-label="Detalle y entrega del pedido">
                  <section className="admin-order-modal">
                    <header className="admin-order-modal-head">
                      <div>
                        <span>DETALLE DE PEDIDO</span>
                        <h3>VEX-{selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
                        <p>{selectedOrder.profiles?.full_name || "Cliente sin nombre"} · {new Date(selectedOrder.created_at).toLocaleString("es-PE")}</p>
                      </div>
                      <button type="button" className="admin-icon-button" onClick={closeOrderDetail}>×</button>
                    </header>

                    <div className="admin-order-modal-body">
                      <section className="admin-order-summary-card">
                        <div>
                          <span>PRODUCTO</span>
                          <strong>{selectedOrder.order_items?.[0]?.product_name || "—"}</strong>
                          <small>{selectedOrder.order_items?.[0]?.plan_name || "Acceso digital"} · {selectedOrder.order_items?.[0]?.duration || "—"}</small>
                        </div>
                        <div className="admin-order-summary-price">
                          <span>TOTAL</span>
                          <strong>S/{Number(selectedOrder.total || 0).toFixed(2)}</strong>
                          <small className={"admin-status status-" + selectedOrder.status}>{statusLabels[selectedOrder.status] || selectedOrder.status}</small>
                        </div>
                      </section>

                      <section className="admin-order-accesses">
                        <div className="admin-panel-head">
                          <div><span>ENTREGA</span><h4>Accesos del pedido</h4></div>
                          <button type="button" className="admin-primary" onClick={startAccessCreate}>＋ Registrar acceso</button>
                        </div>

                        {orderAccessesLoading ? (
                          <div className="admin-loading"><span className="admin-spinner" /> Cargando accesos...</div>
                        ) : orderAccesses.length ? (
                          <div className="admin-order-access-list">
                            {orderAccesses.map((access) => (
                              <article className="admin-order-access-card" key={access.id}>
                                <div>
                                  <span className={"admin-status status-" + access.status}>{access.status}</span>
                                  <strong>{access.email || access.username || "Sin usuario"}</strong>
                                  <small>{access.access_type} · {access.two_factor_enabled ? "2FA activo" : "Sin 2FA"}</small>
                                  <small>Vence: {access.expires_at ? new Date(access.expires_at).toLocaleString("es-PE") : "Sin fecha"}</small>
                                </div>
                                <div className="admin-plan-actions">
                                  <button type="button" onClick={() => startAccessEdit(access)}>Editar</button>
                                  <button type="button" onClick={() => deleteAccess(access)}>Eliminar</button>
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="admin-empty-block">Este pedido todavía no tiene un acceso registrado.</div>
                        )}
                      </section>

                      <form className="admin-access-form" onSubmit={saveAccess}>
                        <div>
                          <span>{accessEditing ? "EDITAR ACCESO" : "NUEVA ENTREGA"}</span>
                          <h4>{accessEditing ? "Actualizar acceso" : "Registrar credenciales"}</h4>
                          <p>Los datos quedan asociados únicamente al pedido seleccionado.</p>
                        </div>
                        <div className="admin-access-form-grid">
                          <label><span>Tipo de acceso</span><input required value={accessForm.access_type} onChange={(e) => setAccessForm({ ...accessForm, access_type: e.target.value })} placeholder="cuenta" /></label>
                          <label><span>Correo</span><input type="email" value={accessForm.email} onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })} placeholder="cliente@correo.com" /></label>
                          <label><span>Usuario</span><input value={accessForm.username} onChange={(e) => setAccessForm({ ...accessForm, username: e.target.value })} placeholder="usuario" /></label>
                          <label><span>Contraseña</span><input type="text" value={accessForm.password} onChange={(e) => setAccessForm({ ...accessForm, password: e.target.value })} placeholder="Contraseña de acceso" /></label>
                          <label><span>Inicio</span><input type="datetime-local" value={accessForm.starts_at} onChange={(e) => setAccessForm({ ...accessForm, starts_at: e.target.value })} /></label>
                          <label><span>Vencimiento</span><input type="datetime-local" value={accessForm.expires_at} onChange={(e) => setAccessForm({ ...accessForm, expires_at: e.target.value })} /></label>
                          <label><span>Estado</span><select value={accessForm.status} onChange={(e) => setAccessForm({ ...accessForm, status: e.target.value })}><option value="active">Activo</option><option value="pending">Pendiente</option><option value="expired">Vencido</option><option value="revoked">Revocado</option></select></label>
                          <label className="admin-switch-row"><input type="checkbox" checked={accessForm.two_factor_enabled} onChange={(e) => setAccessForm({ ...accessForm, two_factor_enabled: e.target.checked })} /><span>2FA habilitado</span></label>
                          <label className="admin-access-full"><span>Notas de entrega</span><textarea rows="3" value={accessForm.notes} onChange={(e) => setAccessForm({ ...accessForm, notes: e.target.value })} placeholder="Indicaciones, perfil, dispositivo o condiciones." /></label>
                        </div>
                        <div className="admin-plan-form-actions">
                          {accessEditing && <button type="button" className="admin-secondary" onClick={startAccessCreate}>Cancelar edición</button>}
                          <button type="submit" className="admin-primary" disabled={accessSaving}>{accessSaving ? "Guardando..." : accessEditing ? "Guardar cambios" : "Registrar acceso"}</button>
                        </div>
                      </form>
                    </div>
                  </section>
                </div>
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
