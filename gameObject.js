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
   
    this.container.name = "container"

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
    this.cambiarAnimacion("caminarAbajo");

    
   //this.sprite.play();
   // this.sprite.loop = true;
   // this.sprite.animationSpeed = 0.1;

    //establezco el punto de pivot en el medio:
   // this.sprite.anchor.set(0.5);

    //agrego el sprite al stage
    //this.juego es una referencia a la instancia de la clase Juego
    //a su vez el juego tiene una propiedad llamada pixiApp, q es la app de PIXI misma,
    //q a su vez tiene el stage. Y es el Stage de pixi q tiene un metodo para agregar 'hijos'
    //(el stage es como un container/nodo) //
   // this.juego.pixiApp.stage.addChild(this.sprite);
    this.juego.pixiApp.stage.addChild(this.container);
  }

  cambiarAnimacion(cual){
    // todos invisibles
    for(let key of Object.keys(this.spritesAnimados)){
        this.spritesAnimados[key].visible = false;
    }
    // se hace visible el que queremos
    this.spritesAnimados[cual].visible = true;
  }


  cargarSpritesAnimados(textureData){
    for(let key of Object.keys(textureData.animations)){
        this.spritesAnimados[key] = new PIXI.AnimatedSprite(textureData.animations[key]);


        this.spritesAnimados[key].play();
        this.spritesAnimados[key].loop = true;
        this.spritesAnimados[key].animationSpeed = 0.1;
         this.spritesAnimados[key].anchor.set(0.5,1)
        

        this.container.addChild(this.spritesAnimados[key]);


    }

  
    
  }





  tick() {
    this.aceleracion.x = 0;
    this.aceleracion.y = 0;

    this.escapar();
    this.perseguir();
    
    this.multitud(this.juego.aliens);

    this.limitarAceleracion();
    this.velocidad.x += this.aceleracion.x;
    this.velocidad.y += this.aceleracion.y;

     //variaciones de la velocidad

     this.rebotar();
     this.aplicarFriccion();
     this.limitarVelocidad();

    //pixeles por frame
    this.posicion.x += this.velocidad.x;
    this.posicion.y += this.velocidad.y;

    this.angulo = radianesAGrados(Math.atan2(this.velocidad.y, this.velocidad.x)) + 180;

    this.cambiarDeSpriteAnimadoSegunAngulo()

    this.render();

    }

    cambiarDeSpriteAnimadoSegunAngulo(){
    //0 grados es a la izq, abre en sentido horario, por lo cual 180 es a la derecha
    //90 es para arriba
    //270 abajo

    if ((this.angulo > 315 && this.angulo < 360) || this.angulo < 45) {
      this.cambiarAnimacion("caminarIzquierda");
      this.spritesAnimados.caminarIzquierda.scale.x = 1;
    } else if (this.angulo > 135 && this.angulo < 225) {
      this.cambiarAnimacion("caminarIzquierda");
      this.spritesAnimados.caminarIzquierda.scale.x = -1;
    } else if (this.angulo < 135 && this.angulo > 45) {
      this.cambiarAnimacion("caminarArriba");
    } else {
      this.cambiarAnimacion("caminarAbajo");
    }

    
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
    //ejemplo mas realista
    if (this.posicion.x > this.juego.width || this.posicion.x < 0) {
      //si la coordenada X de este conejito es mayor al ancho del stage,
      //o si la coordenada X.. es menor q 0 (o sea q se fue por el lado izquierdo)
      //multiplicamos por -0.99, o sea que se invierte el signo (si era positivo se hace negativo y vicecversa)
      //y al ser 0.99 pierde 1% de velocidad
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

}