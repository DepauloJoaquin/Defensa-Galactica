class PersonajePPal extends GameObject {
  constructor(textureData, x, y, mundo) {
    super(textureData, x, y, mundo);
   

    // Vida del jugador
    this.vidaMaxima = 200;
    this.vida = this.vidaMaxima;
    this.muerto = false;

     this.cambiarAnimacion("idle");

  };



  cargarSpritesAnimados(textureData) {
    // Limpiar cualquier sprite previo del container (por si hay alguno del padre)
    super.cargarSpritesAnimados(textureData);
  }

  // ----------------- INPUT → ACELERACIÓN -----------------


  aplicarComportamiento() {
    const keys = this.juego.keys;

    // Resetear aceleración antes de aplicar entradas
    this.aceleracion.x = 0;
    this.aceleracion.y = 0;

    // Movimiento horizontal (A/D o flechas)
    const left = keys['a'] || keys['arrowleft'];
    const right = keys['d'] || keys['arrowright'];
    if (left && !right) this.aceleracion.x = -this.aceleracionMaxima;
    else if (right && !left) this.aceleracion.x = this.aceleracionMaxima;

    // Movimiento vertical (W/S o flechas)
    const up = keys['w'] || keys['arrowup'];
    const down = keys['s'] || keys['arrowdown'];
    if (up && !down) this.aceleracion.y = -this.aceleracionMaxima;
    else if (down && !up) this.aceleracion.y = this.aceleracionMaxima;

  };


   // ----------------- ANIMACIONES SEGÚN MOVIMIENTO -----------------

  cambiarDeSpriteAnimadoSegunAngulo() {
  const vel  = this.velocidad;
  const acel = this.aceleracion;
    // ¿Se está moviendo?

    const moviendo =
    Math.abs(vel.x)  > 0.15 ||
    Math.abs(vel.y)  > 0.15 ||
    Math.abs(acel.x) > 0    ||
    Math.abs(acel.y) > 0;

  // Dirección por defecto: mirando a la derecha
     let mirandoDerecha = true;
  
     // 1) Dirección según movimiento
  if (acel.x > 0.1 || vel.x > 0.1) {
    mirandoDerecha = true;
  } else if (acel.x < -0.1 || vel.x < -0.1) {
    mirandoDerecha = false;
  }
// Elegimos animación
  let nombreAnim;
   if (moviendo) {
    nombreAnim = 'caminarDerecha';
  } else {
    nombreAnim = 'idle';
  }
  
  this.cambiarAnimacion(nombreAnim);

  // Flip horizontal según mirandoDerecha
  const sprite = this.spritesAnimados[nombreAnim];
  if (sprite && sprite.scale) {
    if (mirandoDerecha) {
      sprite.scale.x = 1;
    } else {
      sprite.scale.x = -1;
    }
  }
  
}

   // ----------------- COMBATE -----------------

  // Combate del jugador
  recibirDaño(cant = 10) {
    if (this.muerto) return;
    this.vida -= cant;
    // Pequeño parpadeo visual
    if (this.container) {
      this.container.alpha = 0.6;
      setTimeout(() => { if (this.container) this.container.alpha = 1; }, 80);
    }
    if (this.vida <= 0) {
      this.vida = 0;
      this.morir();
    }
  }

  morir() {
    if (this.muerto) return;
    this.muerto = true;
    // Notificar al juego para mostrar la pantalla de derrota
    this.juego.onPlayerDestroyed();
  }


}









