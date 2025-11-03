class GameObject{
 //defino las propiedades q tiene mi clase, aunq podria no definirlas
  sprite;
  id;
  x = 0;
  y = 0;
  target;
  perseguidor;
  aceleracionMaxima = 0.2;
  velocidadMaxima = 3;
  spritesAnimados = {};

  constructor(textureData, x, y, juego) {


    this.container = new PIXI.Container();
   
    this.container.name = "container";

    this.container.x = x;
    this.container.y = y;

    this.vision = Math.random() * 200 + 1800;
    //guarda una referencia a la instancia del juego
    this.posicion = { x: x, y: y };
    this.velocidad = { x: Math.random() * 10, y: Math.random() * 10 };
    this.aceleracion = { x: 0, y: 0 };
    this.juego = juego;
    //generamos un ID para este objeto
    this.id = Math.floor(Math.random() * 99999999);

    // tomo como parametro la textura y creo un sprite

   // this.sprite = new PIXI.AnimatedSprite(textureData.animations.caminarAbajo);

    this.cargarSpritesAnimados(textureData);
   const tieneAnims   = this.spritesAnimados && Object.keys(this.spritesAnimados).length > 0;
      const tipo         = this.constructor.name;
    const REQUERIDAS = {
  // alien usa estas (las que viste en alienDef.json)
  Alien: [
    'idleArriba','idleAbajo','idleIzquierda',
    'caminarArriba','caminarAbajo','caminarIzquierda',
    'correrArriba','correrAbajo','correrIzquierda',
    'atacarArriba','atacarAbajo','atacarIzquierda'
  ],
  // prota SOLO tiene estas
  PersonajePPal: [
    'idle','caminarDerecha','dispararArriba'
  ]
  // otros tipos (Muro, etc.) no tienen anims -> no chequear
};

if (tieneAnims && REQUERIDAS[tipo]) {
  for (const k of REQUERIDAS[tipo]) {
    if (!this.spritesAnimados[k]) {
      console.warn(`[ANIM FALTA] ${tipo} id=${this.id}: "${k}"`);
    }
  }
}






// Elegí la mejor disponible: idle → caminarAbajo → primera que exista
if (this.spritesAnimados && Object.keys(this.spritesAnimados).length) {
  if (this.spritesAnimados.idle) this.cambiarAnimacion('idle');
  else if (this.spritesAnimados.caminarAbajo) this.cambiarAnimacion('caminarAbajo');
  else {
    const first = Object.keys(this.spritesAnimados)[0];
    this.cambiarAnimacion(first);
  }
}

// añadir al stage
(this.juego.containerPrincipal || this.juego.pixiApp.stage).addChild(this.container);
  }

cambiarAnimacion(cual){
  if (!this.spritesAnimados || !Object.keys(this.spritesAnimados).length) return;

  
   if (!this.spritesAnimados[cual]) {
    if (cual?.startsWith?.('atacar')) {
      console.warn(`[ANIM ATAQUE INEXISTENTE] "${cual}" en`, this.constructor.name, 'id=', this.id);
      return; // 
    }
    const fallbacks = ['idleAbajo','idleArriba','idleIzquierda','caminarAbajo','caminarArriba','caminarIzquierda'];
    const fb = fallbacks.find(k => this.spritesAnimados[k]) || this._animActual;
    if (!fb) return;
    cual = fb;
  }

  if (this._animActual === cual) return;
   const next = this.spritesAnimados[cual];
   if (!next) return; 

  if (this._animActual && this.spritesAnimados[this._animActual]) {
  const prev = this.spritesAnimados[this._animActual];
  prev.stop?.();
  prev.visible = false;
}


const target = this.spritesAnimados[cual];
if (target) {
  target.visible = true;
  target.gotoAndPlay?.(0); 
  this._animActual = cual;
}
}



  cargarSpritesAnimados(textureData){
  this.spritesAnimados = {};

  const anims = textureData && textureData.animations;
  if (!anims) return; 

  for (let key of Object.keys(anims)) {
    const sp = new PIXI.AnimatedSprite(anims[key]);
    sp.loop = true;
    sp.animationSpeed = 0.1;
    sp.anchor.set(0.5, 1);
    sp.visible = false;              
    this.spritesAnimados[key] = sp;
    this.container.addChild(sp);
  }
  
    
  }




tick(dt){
  // reset
  this.aceleracion.x = 0;
  this.aceleracion.y = 0;

  this.aplicarComportamiento?.(dt);

  if (!this._movedWithCollision) {
    // integrar física básica
    this.limitarAceleracion();
    this.velocidad.x += this.aceleracion.x;
    this.velocidad.y += this.aceleracion.y;

    this.rebotar();
    this.aplicarFriccion();
    this.limitarVelocidad();

    // SIEMPRE mover con colisión cuando exista el sistema de muros
    if (this.juego?.hayColisionEntreMuroYAlien) {
      this._moverConColision(dt);   // usa this.velocidad como desplazamiento
      this._movedWithCollision = true;
    } else {
 
      this.posicion.x += this.velocidad.x;
      this.posicion.y += this.velocidad.y;
    }
  }


   const evitaAutoAngulo =
    this.fsm &&
    (this.fsm.actual === 'AGGRESSIVE_WALL' ||
     this.fsm.actual === 'AGGRESSIVE_PLAYER' ||
     this.fsm.actual === 'DEAD');

  if (!evitaAutoAngulo) {
    const vx = this.velocidad.x, vy = this.velocidad.y;
    const speed = Math.hypot(vx, vy);


// sólo si realmente se mueve
if (speed > 1.0) {                
  this._lookAngle = Math.atan2(vy, vx);
}
// usa el último ángulo válido
const look = this._lookAngle ?? 0;
this.angulo = radianesAGrados(look) + 180;



  
}


  this.cambiarDeSpriteAnimadoSegunAngulo?.();
  this.render();

  // reset flag para el próximo frame
  this._movedWithCollision = false;

}

    cambiarDeSpriteAnimadoSegunAngulo(){
    //0 grados es a la izq, abre en sentido horario, por lo cual 180 es a la derecha
    //90 es para arriba
    //270 abajo
    
    }



    limitarAceleracion(){
        this.aceleracion = limitarVector(this.aceleracion,this.aceleracionMaxima)
    }

    limitarVelocidad(){
        this.velocidad = limitarVector(this.velocidad,this.velocidadMaxima)
    }

    aplicarFriccion(){
        this.velocidad.x *= 0.95;
        this.velocidad.y *= 0.95;
    }

     rebotar() {

    if (this.posicion.x > this.juego.width || this.posicion.x < 0) {
      this.velocidad.x *= -0.99;
    }

     if (this.posicion.y > this.juego.height || this.posicion.y < 0) {
      this.velocidad.y *= -0.99;
    }
  }

    asignarTarget(quien){
    this.target = quien;
    }

    perseguir(){
        if(!this.target) return

        const dist = calcularDistancia(this.posicion,this.target.posicion);

        if(dist > this.vision) return;

        const diferenciaX = this.target.posicion.x - this.posicion.x;
        const diferenciaY = this.target.posicion.y - this.posicion.y;

        let deseado = { x: diferenciaX , y: diferenciaY};

        deseado = setearMagnitudAVector(deseado,this.velocidadMaxima);

        let direccion = {x: deseado.x - this.velocidad.x,
                        y: deseado.y - this.velocidad.y
        }

        direccion = limitarVector(direccion,this.aceleracionMaxima);

        this.aceleracion.x += direccion.x;
        this.aceleracion.y += direccion.y;
    }

   

    escapar(){
        if(!this.perseguidor) return;
        const dist = calcularDistancia(this.posicion,this.perseguidor.posicion);

        if(dist > this.vision) return;

        const diferenciaX = this.posicion.x -  this.perseguidor.posicion.x;
        const diferenciaY = this.posicion.y - this.perseguidor.posicion.y;

        let direccionDeseada = setearMagnitudAVector({x : diferenciaX, y: diferenciaY},this.velocidadMaxima);

        let direccion = { x: direccionDeseada.x - this.velocidad.x,
                    y: direccionDeseada.y - this.velocidad.y };
        
        direccion = limitarVector(direccion,this.aceleracionMaxima);

        this.aceleracion.x += direccion.x;
        this.aceleracion.y += direccion.y;

    }

    

    asignarVelocidad(x,y){
        this.velocidad.x = x;
        this.velocidad.y = y;
    }

    render(){
        this.container.x = this.posicion.x;
        this.container.y = this.posicion.y;
        this.container.zIndex = this.posicion.y;
    }



     // boids

  alinear(aliens){
    let radioDePercepcion = 100;
    let vectorDireccionDeseada = { x: 0, y: 0 }
    let total = 0;

    for (let otroAlien of aliens){
      let distancia = calcularDistancia(this.posicion,otroAlien.posicion);
      if ( otroAlien !== this && distancia < radioDePercepcion){
        vectorDireccionDeseada.x += otroAlien.velocidad.x;
        vectorDireccionDeseada.y += otroAlien.velocidad.y;
        total++;
      }
      
    }
    if (total > 0){
       vectorDireccionDeseada.x /= total;
       vectorDireccionDeseada.y /= total;
       vectorDireccionDeseada = setearMagnitudAVector(vectorDireccionDeseada,this.velocidadMaxima);
       vectorDireccionDeseada.x -= this.velocidad.x;
       vectorDireccionDeseada.y -= this.velocidad.y;
       vectorDireccionDeseada = limitarVector(vectorDireccionDeseada,this.aceleracionMaxima);


      
    }
    return vectorDireccionDeseada;
  }
    multitud(unosAliens){
    const pesoAlinear = 1.0; // cuánto pesa alinear
    const pesoReunion = 0.7;  // cuánto pesa cohesionarse
    const pesoSeparacion = 1.2; // cuánto pesa separarse (suele ser el más alto)
    let alineamiento = this.alinear(unosAliens);
    let reunion = this.cohesion(unosAliens);
    let distanciamiento = this.separacion(unosAliens);
   
    this.aceleracion.x += pesoAlinear*alineamiento.x + pesoReunion* reunion.x + pesoSeparacion* distanciamiento.x;
    this.aceleracion.y += pesoAlinear*alineamiento.y + pesoReunion* reunion.y + pesoSeparacion* distanciamiento.y;

  }

    cohesion(aliens){
    let radioDePercepcion = 100;
    let vectorDireccionDeseada = { x: 0, y: 0 }
    let total = 0;

    for (let otroAlien of aliens){
      let distancia = calcularDistancia(this.posicion,otroAlien.posicion);
      if ( otroAlien !== this && distancia < radioDePercepcion){
        vectorDireccionDeseada.x += otroAlien.posicion.x;
        vectorDireccionDeseada.y += otroAlien.posicion.y;
        total++;
      }
      
    }
    if (total > 0){
       vectorDireccionDeseada.x /= total;
       vectorDireccionDeseada.y /= total;
       vectorDireccionDeseada.x -= this.posicion.x;
       vectorDireccionDeseada.y -= this.posicion.y;
       vectorDireccionDeseada = setearMagnitudAVector(vectorDireccionDeseada,this.velocidadMaxima);
       vectorDireccionDeseada.x -= this.velocidad.x;
       vectorDireccionDeseada.y -= this.velocidad.y;
       vectorDireccionDeseada = limitarVector(vectorDireccionDeseada,this.aceleracionMaxima);


      
    }
    return vectorDireccionDeseada;
  }

  
    separacion(aliens){
    let radioDePercepcion = 100;
    let vectorDireccionDeseada = { x: 0, y: 0 }
    let total = 0;

    for (let otroAlien of aliens){
      let distancia = calcularDistancia(this.posicion,otroAlien.posicion);
      if ( otroAlien !== this && distancia < radioDePercepcion && distancia > 0){
        let vectorDiferencia = {x: this.posicion.x - otroAlien.posicion.x , y: this.posicion.y - otroAlien.posicion.y};
        vectorDiferencia.x /= distancia;
         vectorDiferencia.y /= distancia;
        vectorDireccionDeseada.x += vectorDiferencia.x;
        vectorDireccionDeseada.y += vectorDiferencia.y;
        total++;
      }
      
    }
    if (total > 0){
       vectorDireccionDeseada.x /= total;
       vectorDireccionDeseada.y /= total;

       vectorDireccionDeseada = setearMagnitudAVector(vectorDireccionDeseada,this.velocidadMaxima);
       vectorDireccionDeseada.x -= this.velocidad.x;
       vectorDireccionDeseada.y -= this.velocidad.y;
       vectorDireccionDeseada = limitarVector(vectorDireccionDeseada,this.aceleracionMaxima);


      
    }
    return vectorDireccionDeseada;
  }

  _moverConColision(dt){

  this.posicion.x += this.velocidad.x;
  this.posicion.y += this.velocidad.y;
  this.bloqueado = false;
  this.muroBloqueo = null;
  this.puntoContacto = null;
}

}