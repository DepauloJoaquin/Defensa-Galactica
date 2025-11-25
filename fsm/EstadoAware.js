// Estado AWARE (Consciente, alerta inicial se mueve lentamente)
class EstadoAware extends Estado {
  enter() { 
    this.timer = 0; 
  }

  update(dt) {
    const personaje = this.personaje; 

    this.timer += dt;

    personaje.moverHaciaJugador(dt, personaje.velLenta);


      // Bloqueado contra pared -> estado agresivo contra pared
    if (personaje.bloqueado && personaje.puntoContacto && personaje._framesBloqueado > FRAMES_BLOQ_MIN) {
      if (this.fsm.actual !== 'AGGRESSIVE_WALL')
         this.fsm.setear('AGGRESSIVE_WALL');
      return;
    }
    // --- Datos del juego y protagonista 
    const juego = personaje.juego;
    const mundo = juego.mundo;

    const posProta = mundo.protagonista.posicion;
    const personajeX = personaje.x;
    const personajeY = personaje.y;

    // Distancia al jugador
    const distanciaCuadPersonajeAJugador = dist2(personajeX,personajeY,posProta.x,posProta.y);


    if (distanciaCuadPersonajeAJugador <= personaje.rangoIntrigadoCuad) {
      this.fsm.setear('INTRIGADO');
    } else if (distanciaCuadPersonajeAJugador > personaje.rangoAwareCuad * 1.5) {
      this.fsm.setear('IDLE');
    }

    

    const torreta =  mundo.buscarTorretaCercana(personaje.posicion);

     if (torreta && torreta.vivo) {
      
      let torretaPosicion;
      
      torretaPosicion = torreta.container.position;

       const distanciaEntreTorretaYAlien = dist2(personajeX, personajeY, torretaPosicion.x, torretaPosicion.y);

       // En AWARE, si ve torreta a distancia "intrigado" pasa a agresivo torreta
      if (distanciaEntreTorretaYAlien <= personaje.rangoIntrigadoCuad) {
        if (this.fsm.actual !== 'AGGRESSIVE_TURRET') {
          this.fsm.setear('AGGRESSIVE_TURRET');
        }
        return;
      }
    }
      

    // --- Detección de torreta cercana (mismo umbral que jugador intrigado) ---
  }
}