class Muro extends GameObject {
  static SCALE = 0.1; // Usa un único lugar para la escala

  constructor(texture, x, y, mundo) {
    super({ animations: { dummy: [] } }, x, y, mundo);

    this.velocidad = { x: 0, y: 0 };
    this.aceleracion = { x: 0, y: 0 };
    this.aceleracionMaxima = 0;
    this.velocidadMaxima = 0;
    this.vida = 700;
    this.muerto = false;
    this._blinkTimer = 0; // Para el parpadeo al recibir daño

    // Crear el sprite antes de usarlo
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.scale.set(Muro.SCALE);

    this.posicion = { x, y };               
    this.sprite.position.set(0, 0); // 👈 NO usar x,y aquí 
    
    this.container.addChild(this.sprite); 
   
     this.mundo.muros.push(this);
    this._movedWithCollision = true; 
  }

  cargarSpritesAnimados() {}
  cambiarAnimacion() {}

 cajaAlineadaAEjesMuro() {
  const b = this.sprite.getBounds();

  //Saca la “caja” (rectángulo) que rodea al sprite: posición (x, y) y tamaño (width, height).

  // Encogemos poco en X, bastante en Y (asumiendo que la parte útil
  // de piedras ocupa aprox. la mitad central de la textura).

  //Son porcentajes de cuánto achicar la caja original:
  const SHRINK_X = 0.15; // 15% del ancho
  const SHRINK_Y = 0.70; // 50% del alto  //aumentar aca si los quiero mas pegados al muro

  //Calculan el nuevo tamaño de la caja:
  const newW = b.width  * (1 - SHRINK_X);
  const newH = b.height * (1 - SHRINK_Y);
 /* Como la caja nueva es más chica, hay que centrarla dentro de la caja original.
Para eso se calcula cuánto sobra y se divide por 2:*/

  const offsetX = (b.width  - newW) / 2;
  const offsetY = (b.height - newH) / 2;
  //Crea y devuelve el rectángulo nuevo, centrado, con el tamaño reducido:
  return new PIXI.Rectangle(
    b.x + offsetX,
    b.y + offsetY,
    newW,
    newH
  );
}
  

  morir() {
   // Quitar el container completo del mundo
     if (this.muerto) return;

     this.muerto = true;

      // Avisar a los aliens que estaban pegados a este muro
  for (const alien of this.mundo.aliens) {
    if (alien.muroBloqueo === this) {
      alien.muroBloqueo = null;
      alien.puntoContacto = null;
      alien.bloqueado = false;
      alien._wallStick = 0;

      if (alien.fsm && alien.fsm.actual === 'AGGRESSIVE_WALL') {
        alien.fsm.setear('ALERTA'); // o 'INTRIGADO' / 'AWARE', como prefieras
      }
    }
  }

      // Quitar el container completo del mundo (si tiene padre)
  if (this.container.parent) {
    this.container.parent.removeChild(this.container);
  }

  

   // Lo quita del array de muros del mundo
  const i = this.mundo.muros.indexOf(this);
  if (i >= 0) this.mundo.muros.splice(i, 1);

   this.muerto = true;

    
   // Si este muro es la base principal del mundo, avisar al juego
  if (this.mundo.base === this) {
    this.juego.onBaseDestroyed();
  }
  }  

  tick() {
    this.render();
    // Cuando recibe daño, hacer solo un parpadeo visual sin moverlo
     if (this._blinkTimer > 0) {
    this._blinkTimer -= 1;

    if (this._blinkTimer % 4 < 2) {
      this.container.alpha = 0.6;
    } else {
      this.container.alpha = 1;
    }
  } else {
    this.container.alpha = 1;
  }
  }

  recibirDaño(cant = 10) {
      if (this.muerto) return; 

    this.vida -= cant;
    if (this.vida <= 0) this.morir();
    this._blinkTimer = 10; // Parpadeo visual
  }
}  
