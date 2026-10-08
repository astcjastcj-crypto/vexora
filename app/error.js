"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("VEXORA application error:", error);
  }, [error]);

  return (
    <main className="vexora-system-page">
      <div className="vexora-system-orb">V</div>
      <span>VEXORA · ERROR</span>
      <h1>Algo no salió como esperábamos.</h1>
      <p>Puedes intentar cargar nuevamente la página sin perder tu sesión ni tus datos.</p>
      <button type="button" onClick={() => reset()}>Intentar nuevamente</button>
      <a href="/">Volver al inicio</a>
    </main>
  );
}
