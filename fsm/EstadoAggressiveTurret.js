// Estado AGGRESSIVE_TURRET (Atacando a la torreta)
class EstadoAggressiveTurret extends Estado {
  enter() {
    const per = this.personaje;
    per.cambiarAnimacion(per._animKey('atacar'));
     per.cooldownAttack = 0;
  }

  update(dt) {
    const per = this.personaje;


    const juego = per.juego;
    const mundo = per.mundo
    if (!mundo) {
      this.fsm.setear('ALERTA');
      return;
    }

    const torreta = mundo.buscarTorretaCercana(per.posicion)
    if (!torreta.vivo) {
      this.fsm.setear('ALERTA');
      return;
    }

    const posicionTorreta = torreta.posicion;

    const distanciaAlCuadEntreTorretaYAlien2 = dist2(per.posicion.x, per.posicion.y, posicionTorreta.x, posicionTorreta.y);

    // Mirar a la torreta
    const ang = anguloHacia(per.posicion.x, per.posicion.y, tp.x, tp.y);
    per.angulo = (ang * 180) / Math.PI;

    if (distanciaAlCuadEntreTorretaYAlien2 > per.rangoAtaqueJugadorCuad) {
      // acercarse a la torreta
      per.moverHacia(posicionTorreta, per.velRapida, dt);
      per.cambiarAnimacion(per._animKey("correr"))
    } else {
      // ya está en rango: pegarle
      per.atacarTorreta(per, torreta, dt);
    }
    
    // Si se alejó demasiado, volver a ALERTA (volverá a decidir si seguir jugador/base)
    let estado
    if(d2 < per.rangoAlertaCuad){
      estado = "ALERTA";
    }
    else{
      estado = "INTRIGADO"
    }
    this.fsm.setear(estado);
  }
}
