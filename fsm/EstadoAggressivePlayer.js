class AggressivePlayer extends Estado {
  enter() {
    const per = this.personaje;

    per.cambiarAnimacion(per._animKey('atacar'));

    per.cooldownAttack = 0;
  }

  update(dt) {
    const per = this.personaje;


    const pos = getPosDelJugadorConPersonaje(per);
    if (!pos) { 
      this.fsm.setear('ALERTA'); 
      return; 
    }

    const d2 = dist2(per.posicion.x, per.posicion.y, pos.x, pos.y);
    if (d2 > per.rangoAtaqueJugadorCuad * 1.2) { 
      this.fsm.setear('ALERTA'); 
      return; 
    }

    // Mirar hacia el jugador
    const ang = anguloHacia(per.posicion.x, per.posicion.y, pos.x, pos.y);
    per.angulo = (ang * 180) / Math.PI;

    per.cooldownAttack -= dt;
    if (per.cooldownAttack <= 0) {
      // daño al jugador
      const juego = per.juego;
      const mundo = per.mundo 
      const prota =  mundo.protagonista;
      if(prota){
        prota.recibirDaño(per.dañoJugador);
      }
      per.cooldownAttack = per.ritmoGolpesJugador;
  }
}
}
