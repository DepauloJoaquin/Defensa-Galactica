class ErizoCheco extends EntidadEstatica{
    constructor(x,y,juego,scaleX){
        super(x,y,juego);
        this.radio = 4;
        this.scaleX = scaleX || 0.25 ;
        this.container.label = "erizo" + this.id;
        this.crearSprite();
    }
   async crearSprite() {
  this.sprite = new PIXI.Sprite(PIXI.Texture.from('erizoCheco'));
  this.sprite.anchor.set(0.5, 1);
  this.sprite.scale.set(this.scaleX); 
  this.container.addChild(this.sprite);
  this.render?.();
}
    tick(){}
    cambiarAnimacion() {}
    cargarSpritesAnimados(){}

    getPosicionCentral(){
  // usa la misma convención de tus otros objetos
  if (this.posicion) return this.posicion;
  if (this.container) return this.container.position;
  if (this.sprite) return this.sprite.position;
  return { x: 0, y: 0 };
}
}