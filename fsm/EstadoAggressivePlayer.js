// === PATCH: AggressivePlayer.js
class AggressivePlayer extends Estado {
  enter(){
    const per = this.personaje;
    if (per?.cambiarAnimacion) per.cambiarAnimacion(per._animKey('atacar'));
    per.cooldownAttack = 0;
  }
  update(dt){
    const per = this.personaje;
    if (!per || !per.juego?.protagonista) { this.fsm.setear('ALERTA'); return; }

    const pos = per.juego.protagonista.posicion;
    const d2  = dist2(per.posicion.x, per.posicion.y, pos.x, pos.y);
    if (d2 > per.rangoAtaqueJugadorCuad * 1.2) { this.fsm.setear('ALERTA'); return; }

    // mirar hacia el jugador
    const ang = anguloHacia(per.posicion.x, per.posicion.y, pos.x, pos.y);
    per.angulo = (ang * 180) / Math.PI;

    per.cooldownAttack -= dt;
    if (per.cooldownAttack <= 0) {
      per.juego.protagonista.recibirDaño?.(per.dañoJugador);
      per.cooldownAttack = per.ritmoGolpesJugador;
    }
  }

   setAtaqueAnimAndFlip(p){
  if (!p?.puntoContacto) return;

  const dx = p.puntoContacto.x - p.posicion.x; // muro - alien
  const dy = p.puntoContacto.y - p.posicion.y;
  const ax = Math.abs(dx), ay = Math.abs(dy);

  if (ax >= ay){
    // Horizontal: siempre usar "atacarIzquierda" y espejar si el muro está a la derecha
    p.cambiarAnimacion('atacarIzquierda');
    const sp = p.spritesAnimados?.[p._animActual];
    if (sp) sp.scale.x = (dx > 0) ? -1 : 1;  // muro a derecha => flip = -1
  } else {
    // Vertical: arriba/abajo sin flip
    p.cambiarAnimacion(dy < 0 ? 'atacarArriba' : 'atacarAbajo');
    const sp = p.spritesAnimados?.[p._animActual];
    if (sp) sp.scale.x = 1;
  }
 
}
}
