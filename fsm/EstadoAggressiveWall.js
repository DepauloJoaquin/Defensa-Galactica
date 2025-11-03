class EstadoAggressiveWall extends Estado {
 enter(){
  const p = this.personaje; if (!p) return;
  p.cooldownAttack = 0;
  p._wallStick = 0.25;           // opcional: pequeño "pegado" inicial
  p.setAtaqueAnimAndFlip();       // ← decide anim + flip correcto
}
  update(dt){
    const p = this.personaje; if (!p) return;

    // mirar + empujoncito para mantener contacto
    if (p.puntoContacto) {
      const ang = anguloHacia(p.posicion.x, p.posicion.y, p.puntoContacto.x, p.puntoContacto.y);
      p.angulo = ang * 180 / Math.PI;
      const mov = setearMagnitudAVector(
        { x: p.puntoContacto.x - p.posicion.x, y: p.puntoContacto.y - p.posicion.y },
        20 * dt
      );
      p.velocidad.x = mov.x; p.velocidad.y = mov.y;
    }

    // pegar
    p.cooldownAttack -= dt;
    if (p.cooldownAttack <= 0) {
      p.muroBloqueo?.recibirDaño?.(p.dañoPared || 10);
      p.cooldownAttack = p.ritmoGolpesPared || 0.4;
      p.setAtaqueAnimAndFlip();    // relanza anim + flip correcto
    }

    // --- salida con histéresis ---
    const tol = p.radio + 4;  // más permisivo
    const cerca = p.puntoContacto &&
      dist2(p.posicion.x, p.posicion.y, p.puntoContacto.x, p.puntoContacto.y) <= tol*tol;

    if (cerca || p.bloqueado) {
      p._wallStick = 0.25; // resetea el “pegado”
      return;
    }

    p._wallStick -= dt;
    if (p._wallStick > 0) return; // se queda un ratito más aunque se haya soltado

    // ahora sí, salir
    const pos = p.juego?.protagonista?.posicion;
    if (!pos) { this.fsm.setear('AWARE'); return; }
    const d2 = dist2(p.posicion.x, p.posicion.y, pos.x, pos.y);
    this.fsm.setear(d2 < p.rangoAlertaCuad ? 'ALERTA' : 'INTRIGADO');
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

// Decide animación de ataque y flip mirando a (tx, ty)
function setAtaqueAnimAndFlipToPoint(p, tx, ty){
  const dx = tx - p.posicion.x;
  const dy = ty - p.posicion.y;

  // ¿horizontal o vertical?
  if (Math.abs(dx) >= Math.abs(dy)) {
    // horizontal: usar "atacarIzquierda" y espejar si el target está a la derecha
    p.cambiarAnimacion('atacarIzquierda');
    const sp = p.spritesAnimados?.[p._animActual];
    if (sp) sp.scale.x = (dx > 0 ? -1 : 1); // derecha => -1, izquierda => 1
  } else {
    // vertical: arriba/abajo sin flip
    p.cambiarAnimacion(dy < 0 ? 'atacarArriba' : 'atacarAbajo');
    const sp = p.spritesAnimados?.[p._animActual];
    if (sp) sp.scale.x = 1;
  }
}




  


