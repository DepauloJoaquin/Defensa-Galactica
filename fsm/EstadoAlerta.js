class EstadoAlerta extends Estado {
  update(dt) {
    const personaje = this.personaje; 
 

    // 1) obtener posición del jugador 
    const jugadorPosicion = getPosDelJugadorConPersonaje(personaje);

      if (!jugadorPosicion) {
      // si por algún motivo no hay jugador (murió etc.), bajamos un estado
      this.fsm.setear('INTRIGADO');
      return;
    }

    
    const jugadorPosicionX = jugadorPosicion.x;
    const jugadorPosicionY = jugadorPosicion.y;

    // 2) moverse hacia el jugador
    personaje.moverHaciaJugador(dt, personaje.velRapida, jugadorPosicion);

     personaje.cambiarAnimacion(personaje._animKey('correr') || personaje._animKey('correrAbajo'));

    // 3) chequeo si hay muro y si hay se cambia el estado a agressive wall
    if (personaje.bloqueado && personaje.puntoContacto && personaje._framesBloqueado > FRAMES_BLOQ_MIN) {
      if (this.fsm.actual !== 'AGGRESSIVE_WALL') 
        this.fsm.setear('AGGRESSIVE_WALL');
      return;
    }

    // 4) distancias con el jugador
    const distanciaAlJugadorAlCuad = dist2(personaje.posicion.x, personaje.posicion.y, jugadorPosicionX, jugadorPosicionY);

    if (distanciaAlJugadorAlCuad <= personaje.rangoAtaqueJugadorCuad)
      this.fsm.setear('AGGRESSIVE_PLAYER');
    else if (distanciaAlJugadorAlCuad > personaje.rangoAlertaCuad * 1.4)
      this.fsm.setear('INTRIGADO');

    // 5) NO tocamos aquí _approachBase -> se gestiona en tick()
    
   const juego = personaje.juego;
   const mundo = personaje.mundo;

    
   

   const torreta = mundo.buscarTorretaCercana(personaje.posicion);

   if (!torreta) return; 

   const torretaPosicion = torreta.posicion;

    if (!torretaPosicion) return;

   const distanciaAlCuadradoDesdePersjHastaTorreta = dist2(personaje.posicion.x,personaje.posicion.y,torretaPosicion.x,torretaPosicion.y);

   if(this.fsm.actual !== "AGGRESSIVE_TURRET"){
    this.fsm.setear("AGGRESSIVE_TURRET")
   }
   return;

  }
}
