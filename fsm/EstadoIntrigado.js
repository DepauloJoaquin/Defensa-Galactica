// ================= INTRIGADO =================
class EstadoIntrigado extends Estado{
  update(dt){
    const p = this.personaje; if (!p) return;

    if (p.moverHaciaJugador) p.moverHaciaJugador(dt, p.velMedia);

    if (p.bloqueado && p.puntoContacto && p._framesBloqueado > FRAMES_BLOQ_MIN) {
      if (this.fsm.actual !== 'AGGRESSIVE_WALL') this.fsm.setear('AGGRESSIVE_WALL');
  return;
    }

    const pos = p.juego?.protagonista?.posicion; if (!pos) return;
    const d2 = dist2(p.posicion.x, p.posicion.y, pos.x, pos.y);

    if (d2 <= p.rangoAlertaCuad) this.fsm.setear('ALERTA');
    else if (d2 > p.rangoIntrigadoCuad * 1.3) this.fsm.setear('AWARE');
  }
}