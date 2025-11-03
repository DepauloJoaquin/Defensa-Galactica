const FRAMES_BLOQ_MIN = 3; // para evitar falsa detección al rozar

// ================= IDLE =================
class EstadoIdle extends Estado {
  enter(){ /* opcional: idle visual */ }

  update(dt){
    const p = this.personaje; if (!p) return;

    // si quedó trabado contra un muro, pasar a agresivo muro
    if (p.bloqueado && p.puntoContacto && p._framesBloqueado > FRAMES_BLOQ_MIN) {
      if (this.fsm.actual !== 'AGGRESSIVE_WALL') this.fsm.setear('AGGRESSIVE_WALL');
  return;
    }

    // ve al jugador -> AWARE
    const pos = p.juego?.protagonista?.posicion;
    if (!pos) return;
    const d2 = dist2(p.posicion.x, p.posicion.y, pos.x, pos.y);
    if (d2 <= p.rangoAwareCuad) { this.fsm.setear('AWARE'); return; }

    // --- detectar torreta cercana y atacar ---
    const t = p.juego?.buscarTorretaCercana?.(p.posicion);
if (t?.vivo) {
  const tp = t.container?.position ?? t.posicion;
  const d2T = dist2(p.posicion.x, p.posicion.y, tp.x, tp.y);

  // el umbral que prefieras (p.ej. igual que jugador)
  if (d2T <= p.rangoAlertaCuad) {
    if (this.fsm.actual !== 'AGGRESSIVE_TURRET') this.fsm.setear('AGGRESSIVE_TURRET');
    return;
  }
}

    // (opcional) boids/wander
    p.aplicarComportamiento?.(dt);
  }
}