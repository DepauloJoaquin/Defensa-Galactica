class EstadoAggressiveTurret extends Estado{
  enter(){
    const per = this.personaje;
    if (per?.cambiarAnimacion) per.cambiarAnimacion(per._animKey?.('atacar') || 'atacarIzquierda');
    per.cooldownAttack = 0;
  }

  update(dt){
    const per = this.personaje;
    if (!per || !per.juego) return;

    const torreta = per.juego?.buscarTorretaCercana?.(per.posicion);
    if (!torreta || !torreta.vivo) { this.fsm.setear('ALERTA'); return; }

    const tp = torreta.container?.position ?? torreta.posicion;

    const d2 = dist2(per.posicion.x, per.posicion.y, tp.x, tp.y);

    // mirar a la torreta
    const ang = anguloHacia(per.posicion.x, per.posicion.y, tp.x, tp.y);
    per.angulo = (ang * 180) / Math.PI;

    if (d2 > per.rangoAtaqueJugadorCuad){
      per.moverHacia?.(tp, per.velRapida, dt); 
      if (per?.cambiarAnimacion) per.cambiarAnimacion(per._animKey?.('correr') || 'correrAbajo');  // ← pasar dt
    } else {
      per.atacarTorreta?.(per, torreta, dt);    // ← pasar dt
    }

    if (d2 > per.rangoAtaqueJugadorCuad * 1.4) this.fsm.setear('ALERTA');
  }
}
