class EstadoAware extends Estado{
  enter(){ this.timer = 0; }
  update(dt){
    const p = this.personaje; if (!p) return;
    this.timer += dt;

    if (p.moverHaciaJugador) p.moverHaciaJugador(dt, p.velLenta);

    if (p.bloqueado && p.puntoContacto && p._framesBloqueado > FRAMES_BLOQ_MIN) {
       if (this.fsm.actual !== 'AGGRESSIVE_WALL') this.fsm.setear('AGGRESSIVE_WALL');
  return;
    }

    const pos = p.juego?.protagonista?.posicion; if (!pos) return;
    const d2 = dist2(p.posicion.x, p.posicion.y, pos.x, pos.y);

    if (d2 <= p.rangoIntrigadoCuad) this.fsm.setear('INTRIGADO');
    else if (d2 > p.rangoAwareCuad * 1.5) this.fsm.setear('IDLE');

    
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
  }
}