// Estado INTRIGADO (Curiosidad, acercándose a velocidad media)
class EstadoIntrigado extends Estado {
  update(dt) {
    const p = this.personaje; 
    if (!p) return;

    if (p.moverHaciaJugador) p.moverHaciaJugador(dt, p.velMedia);

    if (p.bloqueado && p.puntoContacto && p._framesBloqueado > FRAMES_BLOQ_MIN) {
      if (this.fsm.actual !== 'AGGRESSIVE_WALL') this.fsm.setear('AGGRESSIVE_WALL');
      return;
    }

    const pos = p.juego?.protagonista?.posicion; 
    if (!pos) return;
    const d2 = dist2(p.posicion.x, p.posicion.y, pos.x, pos.y);

    if (d2 <= p.rangoAlertaCuad) this.fsm.setear('ALERTA');
    else if (d2 > p.rangoIntrigadoCuad * 1.3) this.fsm.setear('AWARE');
    
    // Detectar torreta cercana (usar mismo umbral que transición a ALERTA contra jugador)
    const mundo = p.juego?.mundo;
    const t = mundo?.buscarTorretaCercana?.(p.posicion);
    if (t?.vivo) {
      const tp = t.container?.position ?? t.posicion;
      const d2T = dist2(p.posicion.x, p.posicion.y, tp.x, tp.y);
      if (d2T <= p.rangoAlertaCuad) {
        if (this.fsm.actual !== 'AGGRESSIVE_TURRET') this.fsm.setear('AGGRESSIVE_TURRET');
        return;
      }
    }
  }
}