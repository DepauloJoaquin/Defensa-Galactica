class PersonajePPal extends GameObject{
    constructor(textureData,x, y, juego) {
    super(textureData,x, y, juego);
     this.cambiarAnimacion("idle");

    };



    cargarSpritesAnimados(textureData) {
    // Limpiar cualquier sprite previo del container (por si hay alguno del padre)
    super.cargarSpritesAnimados(textureData);
    }

    /* cambiarDeSpriteAnimadoSegunAngulo() {
    // El prota solo tiene caminarDerecha
  

    // Espejamos horizontalmente según dirección
    if ((this.angulo > 315 && this.angulo < 360) || this.angulo < 45) {
      // Izquierda
      this.spritesAnimados.caminarDerecha.scale.x = 1;
    } else if (this.angulo > 135 && this.angulo < 225) {
      // Derecha
      this.spritesAnimados.caminarDerecha.scale.x = -1;
    } else if (this.angulo < 135 && this.angulo > 45) {
      // Arriba — por ahora, misma animación
      this.spritesAnimados.caminarDerecha.scale.x = -1;
    } else {
      // Abajo — también misma animación
      this.spritesAnimados.caminarDerecha.scale.x = 1;
    }
  };
  */

  cambiarDeSpriteAnimadoSegunAngulo() {
  // el prota no tiene “arriba/abajo/izquierda” por nombre
  const moviendo = Math.abs(this.velocidad.x) > 0.15 || Math.abs(this.aceleracion.x) > 0;
  if (moviendo) {
    this.cambiarAnimacion('caminarDerecha');
    const mirandoDerecha = (this.aceleracion.x > 0) || (this.aceleracion.x === 0 && this.velocidad.x >= 0);
    this.spritesAnimados.caminarDerecha.scale.x = mirandoDerecha ? 1 : -1;
  } else {
    this.cambiarAnimacion('idle');
    if (this.spritesAnimados.idle) {
      if (this.velocidad.x > 0.1) this.spritesAnimados.idle.scale.x = 1;
      if (this.velocidad.x < -0.1) this.spritesAnimados.idle.scale.x = -1;
    }
  }
}

  aplicarComportamiento(){
    const keys = this.juego.keys;

    this.aceleracion.x = 0;

    if(keys["a"]&& !keys["d"]){
      this.aceleracion.x = -this.aceleracionMaxima;
    }
    else if(keys["d"] && !keys["a"]){
      this.aceleracion.x = this.aceleracionMaxima;
    }
     const moviendo = Math.abs(this.velocidad.x) > 0.15 || Math.abs(this.aceleracion.x) > 0;

     if(moviendo){
      this.cambiarAnimacion("caminarDerecha");
      const mirandoDerecha = (this.aceleracion.x > 0) || (this.aceleracion.x === 0 && this.velocidad.x >= 0);

      if(mirandoDerecha){
        this.spritesAnimados.caminarDerecha.scale.x = 1;
      }
      else{
        this.spritesAnimados.caminarDerecha.scale.x = -1;
      }
     }
     else{
      this.cambiarAnimacion("idle");
      if (this.spritesAnimados.idle) {
        if (this.velocidad.x > 0.1) this.spritesAnimados.idle.scale.x = 1;
        if (this.velocidad.x < -0.1) this.spritesAnimados.idle.scale.x = -1;
      }
     }
  };

  cambiarDeSpriteAnimadoSegunAngulo() {}

  obtenerPosicionDePersonaje(personaje){
  if(!personaje||!personaje.juego||personaje.juego.protagonista){
    return null;
  }
  const posicion = personaje.juego.protagonista.posicion

   // Compruebo que tenga coordenadas válidas
  if(posicion && typeof posicion.x === 'number' && typeof posicion.y === 'number'){
    return posicion
  }
  else{
    return null;
  }
}

 
    
}
   

    






    
