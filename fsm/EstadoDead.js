// === PATCH: EstadoDead.js
class EstadoDead extends Estado{
  enter(){
    const pers = this.personaje;
    if (pers?.cambiarAnimacion) pers.cambiarAnimacion(pers._animKey?.('idle') || 'idleAbajo');
    pers.velocidad.x = pers.velocidad.y = 0;
  }
}
