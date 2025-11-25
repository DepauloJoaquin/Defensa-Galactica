const FRAMES_BLOQ_MIN = 3; // Para evitar falsa detección al rozar

// Estado IDLE (Inactivo)
class EstadoIdle extends Estado {
  enter() { }

  update(dt) {
    const personaje = this.personaje; 
  

    // Si quedó trabado contra un muro, pasar a agresivo muro
    if (personaje.bloqueado && personaje.puntoContacto && personaje._framesBloqueado > FRAMES_BLOQ_MIN) {
      if (this.fsm.actual !== 'AGGRESSIVE_WALL')
         this.fsm.setear('AGGRESSIVE_WALL');
      return;
    }

    const juego = personaje.juego;
     const mundo = juego.mundo;
     const prota = mundo.protagonista;
      // 2) Ve al jugador → AWARE
    if (prota && prota.posicion) {
      const d2Jugador = dist2(
        personaje.posicion.x,
        personaje.posicion.y,
        prota.posicion.x,
        prota.posicion.y
      );

      if (d2Jugador <= personaje.rangoAwareCuad) {
        this.fsm.setear('AWARE');
        return;
      }
    }

     // 3) Detectar torreta cercana (usa el mismo rango de "visión")
    
     const personajePos = personaje.posicion
     const torretaPosicion = mundo.buscarTorretaCercana(personajePos);
    
      // En IDLE la transición al jugador es con rangoAware → usamos lo mismo para torretas
        if (torretaPosicion) {
      const d2Torreta = dist2(
        personaje.posicion.x,
        personaje.posicion.y,
        torretaPosicion.x,
        torretaPosicion.y
      );

       if (d2Torreta <= personaje.rangoAwareCuad) {
        if (this.fsm.actual !== 'AGGRESSIVE_TURRET') {
          this.fsm.setear('AGGRESSIVE_TURRET');
        }
        return;
      }
    }

     // 4) Comportamiento de manada
    personaje.aplicarComportamiento(dt);
  }

  
    
  }
