class Muro extends GameObject {
  static SCALE = 0.1; // usa un único lugar para la escala

  constructor(texture, x, y, juego) {
    super({ animations: { dummy: [] } }, x, y, juego);

    this.velocidad = { x: 0, y: 0 };
    this.aceleracion = { x: 0, y: 0 };
    this.aceleracionMaxima = 0;
    this.velocidadMaxima = 0;

    // CREA el sprite antes de usarlo
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.scale.set(Muro.SCALE);

    this.posicion = { x, y };               
    this.sprite.position.set(x, y);  

   
    
    this.container.addChild(this.sprite); 
    this.juego.containerPrincipal.addChild(this.sprite);
    this.juego.muros.push(this);
    this._movedWithCollision = true; 
  }

 
  cargarSpritesAnimados() {}
  cambiarAnimacion() {}

  cajaAlineadaAEjesMuro(){
    return this.sprite.getBounds();
  }

  tick() {
    
    this.render();
     // cuando recibe daño, hacé solo un parpadeo visual sin moverlo
  if (this._blinkTimer > 0) {
    this._blinkTimer -= 1;
    this.container.alpha = this._blinkTimer % 4 < 2 ? 0.6 : 1;
  } else {
    this.container.alpha = 1;
  }
  }
  recibirDaño(cant = 10) {
  this.vida -= cant;
  if (this.vida <= 0) this.morir();
  this._blinkTimer = 10; // parpadeo visual
}
}

  
