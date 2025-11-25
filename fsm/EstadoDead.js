// Estado DEAD (Muerto)
class EstadoDead extends Estado {
  enter() {
    const pers = this.personaje;
    pers.cambiarAnimacion(pers._animKey('idle') || 'idleAbajo');
    pers.velocidad.x = pers.velocidad.y = 0;
  }
}