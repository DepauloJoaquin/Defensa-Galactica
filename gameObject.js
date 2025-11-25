class GameObject {
  // Definir las propiedades que tiene la clase
  sprite;
  id;
  x = 0;
  y = 0;
  target;
  perseguidor;
  aceleracionMaxima = 0.2;
  velocidadMaxima = 3;
  spritesAnimados = {};

  constructor(textureData, x, y, mundo) {
    this.container = new PIXI.Container();
    this.container.name = "container";
    this.container.x = x;
    this.container.y = y;

    this.vision = Math.random() * 200 + 1800;
    // Guarda una referencia a la instancia del juego
    this.posicion = { x: x, y: y };
    this.velocidad = { x: Math.random() * 10, y: Math.random() * 10 };
    this.aceleracion = { x: 0, y: 0 };
    this.juego = mundo.juego;
    this.mundo = mundo;
    // Generar un ID único para este objetoa
    this.id = Math.floor(Math.random() * 99999999);

     this._lookAngle = 0; 

    this.cargarSpritesAnimados(textureData);
    const tieneAnims = this.spritesAnimados && Object.keys(this.spritesAnimados).length > 0;
    const tipo = this.constructor.name;
    const REQUERIDAS = {
      // Alien usa estas animaciones (las que están en alienDef.json)
      Alien: [
        'idleArriba', 'idleAbajo', 'idleIzquierda',
        'caminarArriba', 'caminarAbajo', 'caminarIzquierda',
        'correrArriba', 'correrAbajo', 'correrIzquierda',
        'atacarArriba', 'atacarAbajo', 'atacarIzquierda'
      ],
      // Protagonista SOLO tiene estas
      PersonajePPal: [
        'idle', 'caminarDerecha', 'dispararArriba'
      ]
      // Otros tipos (Muro, etc.) no tienen animaciones → no chequear
    };

    if (tieneAnims && REQUERIDAS[tipo]) {
      for (const k of REQUERIDAS[tipo]) {
        if (!this.spritesAnimados[k]) {
          console.warn(`[ANIM FALTA] ${tipo} id=${this.id}: "${k}"`);
        }
      }
    }

    // Elegir la mejor animación disponible: idle → caminarAbajo → primera que exista
    if (this.spritesAnimados && Object.keys(this.spritesAnimados).length) {
      if (this.spritesAnimados.idle) this.cambiarAnimacion('idle');
      else if (this.spritesAnimados.caminarAbajo) this.cambiarAnimacion('caminarAbajo');
      else {
        const first = Object.keys(this.spritesAnimados)[0];
        this.cambiarAnimacion(first);
      }
    }

    // Añadir al contenedor correcto (mundo si existe)
   let stageDestino;

   if (this.mundo && this.mundo.container) {
  stageDestino = this.mundo.container;
} else if (this.juego && this.juego.pixiApp && this.juego.pixiApp.stage) {
  stageDestino = this.juego.pixiApp.stage;
} else {
  // No hay a dónde agregar, salgo
  return;
}
    stageDestino.addChild(this.container);
  }

  cambiarAnimacion(nombreAnimacion) {
    const sprites = this.spritesAnimados;
     if (!sprites) return;

     const siguiente = sprites[nombreAnimacion];
      if (!siguiente) return;


      // Si ya está esa animación, no la reiniciamos
     if (this._animActual === nombreAnimacion) return;

     // Apagar la animación anterior (si existía)
  if (this._animActual) {
    const animActual = sprites[this._animActual];
    if (animActual) {
      animActual.stop();
      animActual.visible = false;
    }
  }

     // Encender la nueva animación
      siguiente.visible = true;
   if (typeof siguiente.gotoAndPlay === 'function') {
    siguiente.gotoAndPlay(0);
  }
   else if (typeof siguiente.play === 'function') {
    siguiente.play();
  }
  this._animActual = nombreAnimacion;
  }
  

  cargarSpritesAnimados(textureData) {
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

  tick(dt) {
    
    // Resetear
    this.aceleracion.x = 0;
    this.aceleracion.y = 0;

    this.aplicarComportamiento(dt);

    if (!this._movedWithCollision) {
      // Integrar física básica
      this.limitarAceleracion();
      this.velocidad.x += this.aceleracion.x;
      this.velocidad.y += this.aceleracion.y;

      
      this.aplicarFriccion();
      this.limitarVelocidad();

      // SIEMPRE mover con colisión cuando existe el sistema de muros
      const mundo = this.mundo;
      if (mundo.hayColisionEntreMuroYAlien) {
        this._moverConColision(dt);   // por ahora sigue siendo “dummy”
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
      const vx = this.velocidad.x
      const  vy = this.velocidad.y;
      const speed = Math.hypot(vx, vy);

      // Solo si realmente se mueve
      if (speed > 1.0) {
        this._lookAngle = Math.atan2(vy, vx);
      }
      // _lookAngle siempre tiene algún valor porque lo seteamos en el constructor
       this.angulo = radianesAGrados(this._lookAngle) + 180;
    }

    this.cambiarDeSpriteAnimadoSegunAngulo();
    this.render();

    // Resetear flag para el próximo frame
    this._movedWithCollision = false;
  }

  cambiarDeSpriteAnimadoSegunAngulo() {
    // 0 grados es a la izquierda, abre en sentido horario, por lo cual 180 es a la derecha
    // 90 es para arriba
    // 270 abajo
  }



  limitarAceleracion() {
    this.aceleracion = limitarVector(this.aceleracion, this.aceleracionMaxima);
  }

  limitarVelocidad() {
    this.velocidad = limitarVector(this.velocidad, this.velocidadMaxima);
  }

  aplicarFriccion() {
    this.velocidad.x *= 0.95;
    this.velocidad.y *= 0.95;
  }

 

  asignarTarget(quien) {
    this.target = quien;
  }

  perseguir() {
    if (!this.target) return;

    const dist = calcularDistancia(this.posicion, this.target.posicion);
    if (dist > this.vision) return;

    const diferenciaX = this.target.posicion.x - this.posicion.x;
    const diferenciaY = this.target.posicion.y - this.posicion.y;

    let deseado = { x: diferenciaX, y: diferenciaY };
    deseado = setearMagnitudAVector(deseado, this.velocidadMaxima);

    let direccion = { x: deseado.x - this.velocidad.x, y: deseado.y - this.velocidad.y };
    direccion = limitarVector(direccion, this.aceleracionMaxima);

    this.aceleracion.x += direccion.x;
    this.aceleracion.y += direccion.y;
  }

  escapar() {
    if (!this.perseguidor) return;
    const dist = calcularDistancia(this.posicion, this.perseguidor.posicion);
    if (dist > this.vision) return;

    const diferenciaX = this.posicion.x - this.perseguidor.posicion.x;
    const diferenciaY = this.posicion.y - this.perseguidor.posicion.y;

    let direccionDeseada = setearMagnitudAVector({ x: diferenciaX, y: diferenciaY }, this.velocidadMaxima);
    let direccion = { x: direccionDeseada.x - this.velocidad.x, y: direccionDeseada.y - this.velocidad.y };
    direccion = limitarVector(direccion, this.aceleracionMaxima);

    this.aceleracion.x += direccion.x;
    this.aceleracion.y += direccion.y;
  }

  asignarVelocidad(x, y) {
    this.velocidad.x = x;
    this.velocidad.y = y;
  }

  render() {
    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y;
    this.container.zIndex = this.posicion.y;
  }

 _moverConColision(dt) {
  const juego = this.juego;
  const mundo = this.mundo;

   // Si no hay mundo o no hay sistema de colisión, mover normal
  if (!mundo.hayColisionEntreMuroYAlien || !this.radio) {
    this.posicion.x += this.velocidad.x; // o this.velocidad.x * dt
    this.posicion.y += this.velocidad.y; // idem arriba
    this.bloqueado = false;
    this.muroBloqueo = null;
    this.puntoContacto = null;
    return;
  }
    // 1) Calcular posición futura
  const nextX = this.posicion.x + this.velocidad.x; // * dt si usás dt
  const nextY = this.posicion.y + this.velocidad.y; // * dt si usás dt


  // 2) Consultar colisión en la posición nueva
  const colision = mundo.hayColisionEntreMuroYAlien(nextX, nextY, this.radio);

  if (!colision || !colision.hayColision) {
    // No hay colisión → aplicar movimiento normal
    this.posicion.x = nextX;
    this.posicion.y = nextY;
    this.bloqueado = false;
    this.muroBloqueo = null;
    this.puntoContacto = null;
    return;
  }
    // 3) Hay colisión → guardar info
  this.bloqueado = true;
  this.muroBloqueo = colision.muro;
  this.puntoContacto = colision.puntoContacto;

  // 4) Empujar el objeto fuera del muro
  // Vector desde el punto de contacto hacia el centro del alien
  let offsetX = nextX - colision.puntoContacto.x;
  let offsetY = nextY - colision.puntoContacto.y;

  let distancia = Math.hypot(offsetX, offsetY);
  if (distancia === 0) distancia = 1; // evitar división por 0

  const normalX = offsetX / distancia;
  const normalY = offsetY / distancia;

  // Posicionar justo al borde (radio + epsilon)
  const EPSILON_SEPARACION = 0.5;
  const separacion = this.radio + EPSILON_SEPARACION;

  this.posicion.x = colision.puntoContacto.x + normalX * separacion;
  this.posicion.y = colision.puntoContacto.y + normalY * separacion;

  // 5)  anular la componente de la velocidad que va hacia el muro
  const velocidadEnNormal =
    this.velocidad.x * normalX + this.velocidad.y * normalY; // proyección sobre la normal

  if (velocidadEnNormal < 0) {
    // restamos esa componente para que deje de "clavarse" contra el muro
    this.velocidad.x -= velocidadEnNormal * normalX;
    this.velocidad.y -= velocidadEnNormal * normalY;
  }
}
}