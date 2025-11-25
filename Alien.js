class Alien extends GameObject {
  constructor(texture, x, y, mundo,tipo = "basico") {
    super(texture, x, y, mundo);
    this.mundo = mundo;

    this.tipo = tipo;   
    this.vision = Math.random() * 200 + 1800;
    this.pesoAlinear = 1.0;
    this.pesoReunion = 0.7;
    this.pesoSeparacion = 1.2;
    this.radioDePercepcion = 100;
    this.radio = 14;
    this.radioColisionMuro = 3;
    this.radioAtaqueMuro  = 4; 
    this.velocidad = { x: 0, y: 0 };
    this._framesBloqueado = 0;

    this.vidaMaxima = 100;
    this.vida = this.vidaMaxima;
    this.vivo = true;
    // velocidades
    this.velLenta = 60;
    this.velMedia = 100;
    this.velRapida = 160;

    // rangos (guardar ^2 para comparar sin raizCuadrada)
  this.rangoAware = 350;
  this.rangoIntrigado = 240;
  this.rangoAlerta = 150;
    this.rangoAtaqueJugador = 40;
  // Ajuste: aumento de visión/detección. Subido de 0.5 -> 0.75 para que vean al protagonista a mayor distancia sin ser global.
  const VISION_FACTOR = 0.75;
  this.vision *= VISION_FACTOR;
  this.rangoAware *= VISION_FACTOR;
  this.rangoIntrigado *= VISION_FACTOR;
  this.rangoAlerta *= VISION_FACTOR;
  this.rangoAwareCuad = this.rangoAware ** 2;
  this.rangoIntrigadoCuad = this.rangoIntrigado ** 2;
  this.rangoAlertaCuad = this.rangoAlerta ** 2;
  this.rangoAtaqueJugadorCuad = this.rangoAtaqueJugador ** 2;

    //combate
    this.dañoPared = 10;
    this.dañoJugador = 8;
    this.ritmoGolpesPared = 0.40;
    this.ritmoGolpesJugador = 0.60;
    this.cooldownAttack = 0;

    //colision
    this.bloqueado = false;
    this.muroBloqueo = null;
    this.puntoContacto = null;

    //FSM
    this.fsm = new FSM(this);
    this.fsm.añadir('IDLE', new EstadoIdle());
    this.fsm.añadir('AWARE', new EstadoAware());
    this.fsm.añadir('INTRIGADO', new EstadoIntrigado());
    this.fsm.añadir('ALERTA', new EstadoAlerta());
    this.fsm.añadir('AGGRESSIVE_WALL', new EstadoAggressiveWall());
    this.fsm.añadir('AGGRESSIVE_PLAYER', new AggressivePlayer());
    this.fsm.añadir('DEAD', new EstadoDead());
    this.fsm.añadir('AGGRESSIVE_TURRET', new EstadoAggressiveTurret());
    this.fsm.setear('IDLE');


  }

  getOtrosAliens() {
  return this.mundo.aliens
}

  aplicarComportamiento() {
  if (!this.fsm || !this.fsm.actual) return;
  const st = this.fsm.actual;

  if (['IDLE', 'AWARE', 'INTRIGADO'].includes(st)) {
    this.buscarObstaculosCerca();
    const aliens = this.mundo.aliens;
    this.multitud(aliens);
  } else if (st === 'AGGRESSIVE_WALL') {
    // solo separación para que no se encimen
    const push = this.separacion(this.mundo.aliens);
    this.aceleracion.x += push.x;
    this.aceleracion.y += push.y;
  }
}

  asignarTarget(quien) {
    this.target = quien;
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

  // Algoritmos de comportamiento en manada (Boids)

  alinear(aliens) {
    let radioDePercepcion = 100;
    let vectorDireccionDeseada = { x: 0, y: 0 }
    let total = 0;

    for (let otroAlien of aliens) {
      let distancia = calcularDistancia(this.posicion, otroAlien.posicion);
      if (otroAlien !== this && distancia < radioDePercepcion) {
        vectorDireccionDeseada.x += otroAlien.velocidad.x;
        vectorDireccionDeseada.y += otroAlien.velocidad.y;
        total++;
      }

    }
    if (total > 0) {
      vectorDireccionDeseada.x /= total;
      vectorDireccionDeseada.y /= total;
      vectorDireccionDeseada = setearMagnitudAVector(vectorDireccionDeseada, this.velocidadMaxima);
      vectorDireccionDeseada.x -= this.velocidad.x;
      vectorDireccionDeseada.y -= this.velocidad.y;
      vectorDireccionDeseada = limitarVector(vectorDireccionDeseada, this.aceleracionMaxima);



    }
    return vectorDireccionDeseada;
  }

  multitud(unosAliens) {
    // Pesos para cada comportamiento de manada
    const pesoAlinear = 1.0;     // Cuánto pesa alinear con el grupo
    const pesoReunion = 0.7;     // Cuánto pesa cohesionarse
    const pesoSeparacion = 1.2;  // Cuánto pesa separarse (suele ser el más alto)
    
    let alineamiento = this.alinear(unosAliens);
    let reunion = this.cohesion(unosAliens);
    let distanciamiento = this.separacion(unosAliens);

    this.aceleracion.x += pesoAlinear * alineamiento.x + pesoReunion * reunion.x + pesoSeparacion * distanciamiento.x;
    this.aceleracion.y += pesoAlinear * alineamiento.y + pesoReunion * reunion.y + pesoSeparacion * distanciamiento.y;

  }

  cohesion(aliens) {
    let radioDePercepcion = 100;
    let vectorDireccionDeseada = { x: 0, y: 0 }
    let total = 0;

    for (let otroAlien of aliens) {
      let distancia = calcularDistancia(this.posicion, otroAlien.posicion);
      if (otroAlien !== this && distancia < radioDePercepcion) {
        vectorDireccionDeseada.x += otroAlien.posicion.x;
        vectorDireccionDeseada.y += otroAlien.posicion.y;
        total++;
      }

    }
    if (total > 0) {
      vectorDireccionDeseada.x /= total;
      vectorDireccionDeseada.y /= total;
      vectorDireccionDeseada.x -= this.posicion.x;
      vectorDireccionDeseada.y -= this.posicion.y;
      vectorDireccionDeseada = setearMagnitudAVector(vectorDireccionDeseada, this.velocidadMaxima);
      vectorDireccionDeseada.x -= this.velocidad.x;
      vectorDireccionDeseada.y -= this.velocidad.y;
      vectorDireccionDeseada = limitarVector(vectorDireccionDeseada, this.aceleracionMaxima);



    }
    return vectorDireccionDeseada;
  }


  separacion(aliens) {
    let radioDePercepcion = 100;
    let vectorDireccionDeseada = { x: 0, y: 0 }
    let total = 0;

    for (let otroAlien of aliens) {
      let distancia = calcularDistancia(this.posicion, otroAlien.posicion);
      if (otroAlien !== this && distancia < radioDePercepcion && distancia > 0) {
        let vectorDiferencia = { x: this.posicion.x - otroAlien.posicion.x, y: this.posicion.y - otroAlien.posicion.y };
        vectorDiferencia.x /= distancia;
        vectorDiferencia.y /= distancia;
        vectorDireccionDeseada.x += vectorDiferencia.x;
        vectorDireccionDeseada.y += vectorDiferencia.y;
        total++;
      }

    }
    if (total > 0) {
      vectorDireccionDeseada.x /= total;
      vectorDireccionDeseada.y /= total;

      vectorDireccionDeseada = setearMagnitudAVector(vectorDireccionDeseada, this.velocidadMaxima);
      vectorDireccionDeseada.x -= this.velocidad.x;
      vectorDireccionDeseada.y -= this.velocidad.y;
      vectorDireccionDeseada = limitarVector(vectorDireccionDeseada, this.aceleracionMaxima);



    }
    return vectorDireccionDeseada;
  }


  recibirDaño(cantidad) {
    if (!this.vivo) return;

    this.vida -= cantidad;

    if (this.container) {
      this.container.alpha = 0.6;
      setTimeout(() => { if (this.container) this.container.alpha = 1; }, 60);
    }
    if (this.vida <= 0) this.morir();
  }

morir() {
  if (!this.vivo) return;
  this.vivo = false;

  const juego = this.mundo.juego;
  const mundo = this.mundo

  // Avisar a WaveManager (puntaje, metal, etc.)
    juego.waveManager.onAlienMuerto(this);
  

  // Quitarme de las listas del mundo
  if (mundo) {
    mundo.aliens = mundo.aliens.filter(a => a !== this);
    mundo.personajes = mundo.personajes.filter(p => p !== this);
  }


    this.container.parent.removeChild(this.container);
  
    this.container.destroy({ children: true });
}


  buscarObstaculosCerca( margenFactor = 10 ) { // (corrijo nombre si era “margen”)
    this.obstaculosCerca = [];
    this.obstaculosQueEstoyColisionando = [];

    const posicion = this.posicion;
    const obstaculos = this.mundo.obstaculos;

    for (const obstaculo of obstaculos) {
      if (!obstaculo) continue;

      let centro = this._obtenerCentroObstaculo(obstaculo);
      if(!centro) continue;

       const radioObstaculo = obstaculo.radio || 0;

      const distancia = calcularDistancia(posicion, centro);
      const distanciaDeColision = this.radio + radioObstaculo;
      const distanciaDeTolerancia = distanciaDeColision + this.radio * margenFactor;

      

      if (distancia < distanciaDeColision) {
        this.obstaculosQueEstoyColisionando.push(obstaculo);
   
      }
      else if ( distancia < distanciaDeTolerancia) {
           this.obstaculosCerca.push(obstaculo);
      }
    }
  }

  _obtenerCentroObstaculo(obstaculo) {
  
    return obstaculo.getPosicionCentral()

  }

moverHaciaJugador(dt, vel, posJugadorOverride) {
  const posJugador = posJugadorOverride || getPosDelJugadorConPersonaje(this);
  if (!posJugador) return;

  const posicionAlien = this.posicion;

  const direccion = { 
    x: posJugador.x - posicionAlien.x, 
    y: posJugador.y - posicionAlien.y 
  };

  const ang = anguloHacia(posicionAlien.x, posicionAlien.y, posJugador.x, posJugador.y);
  this.angulo = radianesAGrados(ang);

  const movimiento = setearMagnitudAVector(direccion, vel * dt);
  this.velocidad.x = movimiento.x;
  this.velocidad.y = movimiento.y;

  if (this._moverConColision)
     this._moverConColision(dt);
  this._movedWithCollision = true;
}


  _moverConColision(dt) {
    const desplazamientoX = this.velocidad.x;
    const desplazamientoY = this.velocidad.y;

    const mundo = this.mundo;

    this.bloqueado = false;
    this.muroBloqueo = null;
    
    const estaPegado = this.fsm.actual === 'AGGRESSIVE_WALL';
    if (!estaPegado) {
      this.puntoContacto = null;
    }

      const rColisionMuro = this.radioColisionMuro;

     // --------- Movimiento en eje X ---------
  const nuevaPosX = this.posicion.x + desplazamientoX;
  if (mundo && typeof mundo.hayColisionEntreMuroYAlien === 'function') {
    const colisionXsiHay = mundo.hayColisionEntreMuroYAlien(
      nuevaPosX,
      this.posicion.y,
      rColisionMuro   
    );

      if (!colisionXsiHay) {
        this.posicion.x = nuevaPosX;
      } else {
        this.velocidad.x = 0;
        this.bloqueado = true;
        this.muroBloqueo = colisionXsiHay.muro;
        this.puntoContacto = colisionXsiHay.puntoContacto;
      }
    }

     // --------- Movimiento en eje Y ---------
    const nuevaPosY = this.posicion.y + desplazamientoY;
  
    const colisionYSiHay = mundo.hayColisionEntreMuroYAlien(
      this.posicion.x,
      nuevaPosY,
      rColisionMuro   
    );

    if (!colisionYSiHay) {
        this.posicion.y = nuevaPosY;
      } else {
        this.velocidad.y = 0;
        this.bloqueado = true;

        // Si no había muro de bloqueo aún, guardo este
        if (!this.muroBloqueo) {
          this.muroBloqueo = colisionYSiHay.muro;
          this.puntoContacto = colisionYSiHay.puntoContacto;
        }
      }
    

     // --------- Frames bloqueado ---------
    if(this.bloqueado){
      this._framesBloqueado = this._framesBloqueado + 1;
    }
    else{
      this._framesBloqueado = 0;
    }


    // --------- Separación suave del muro ---------
  if (this.bloqueado && this.puntoContacto) {
    const desplazamientoEnX = this.posicion.x - this.puntoContacto.x;
    const desplazamientoEnY = this.posicion.y - this.puntoContacto.y;
    let distancia = Math.hypot(desplazamientoEnX, desplazamientoEnY);
    if (distancia < 0.0001) distancia = 0.0001;

    const nuevaX = desplazamientoEnX / distancia;
    const nuevaY = desplazamientoEnY / distancia;

     const EPS = 0.5;
    const distSeparacion = rColisionMuro + EPS;

    this.posicion.x = this.puntoContacto.x + nuevaX * distSeparacion;
    this.posicion.y = this.puntoContacto.y + nuevaY * distSeparacion;
  }

  // --------- Modo agresivo muro: mantener último punto de contacto ---------
  if (this.fsm.actual === 'AGGRESSIVE_WALL') {
    if (this.puntoContacto) {
      this._lastPuntoContacto = {
        x: this.puntoContacto.x,
        y: this.puntoContacto.y
      };
      this._puntoContactoGrace = 0.2; // 200ms de gracia
    } else if (this._lastPuntoContacto && this._puntoContactoGrace > 0) {
      this._puntoContactoGrace -= dt ;
      this.puntoContacto = {
        x: this._lastPuntoContacto.x,
        y: this._lastPuntoContacto.y
      };
    }
  } else {
    this._lastPuntoContacto = null;
    this._puntoContactoGrace = 0;
  }
}
 tick(dt) {
 

  if (this.fsm && this.fsm.actual === 'AGGRESSIVE_WALL') {
    this._movedWithCollision = true;
  }

   // === 0) Percepción del jugador ===

  const posJugador = getPosDelJugadorConPersonaje(this);
  if (posJugador) {
    const d2Jugador = dist2(
      this.posicion.x, this.posicion.y,
      posJugador.x, posJugador.y
    );

    if (d2Jugador <= this.rangoAtaqueJugadorCuad) {
      if (this.fsm.actual !== 'AGGRESSIVE_PLAYER') {
        this._approachBase = false;
        this.fsm.setear('AGGRESSIVE_PLAYER');
      }
    } else if (d2Jugador <= this.rangoAlertaCuad) {
      if (!['AGGRESSIVE_PLAYER','AGGRESSIVE_WALL','AGGRESSIVE_TURRET'].includes(this.fsm.actual)) {
        this._approachBase = false;
        this.fsm.setear('ALERTA');
      }
    }
  }


   // === 0.5) Si no estoy peleando y no veo al jugador -> ir a la base ===
  const mundo =  this.mundo;
  const base  = mundo.base;

  // === 1) Aproximarse a la base SOLO si no estoy en combate ===
  const estadosCombate = ['AGGRESSIVE_WALL','AGGRESSIVE_PLAYER','AGGRESSIVE_TURRET','ALERTA'];

  if (this._approachBase && this._baseTarget && !estadosCombate.includes(this.fsm.actual)) {
    this.moverHacia(this._baseTarget, this.velMedia || 100, dt);

    const d2Base = dist2(this.posicion.x, this.posicion.y, this._baseTarget.x, this._baseTarget.y);
    const STOP_DIST2 = 24 * 24;
    if (d2Base <= STOP_DIST2) {
      this._approachBase = false;
      this.velocidad.x = 0;
      this.velocidad.y = 0;
    }
  }

 
  if (this._approachBase && this.bloqueado && this.puntoContacto) {
    if (this.fsm && this.fsm.actual !== 'AGGRESSIVE_WALL') {
      this.fsm.setear('AGGRESSIVE_WALL');
    }
  }

  if (!this.vivo && this.fsm.actual !== 'DEAD')
    this.fsm.setear("DEAD");

  this.fsm.update(dt);
  super.tick(dt);
}




  _animDirFromAngle() {
    const a = ((this.angulo % 360) + 360) % 360;

    // 0° = derecha (espejada), 90° = arriba, 180° = izquierda, 270° = abajo
    if (a > 140 && a <= 220) return 'Izquierda';  // Izquierda real
    if (a > 50 && a <= 130) return 'Arriba';
    if (a > 310 || a <= 50) return 'Izquierda';  // Derecha espejada
    return 'Abajo';
  }

  _animKey(base) { 
    // base puede ser 'idle', 'caminar', 'correr', 'atacar'
    return `${base}${this._animDirFromAngle()}`;
  }



  

  cambiarDeSpriteAnimadoSegunAngulo() {
    // No cambiar animación si está atacando o muerto
     const estadosBloqueados = [
      'AGGRESSIVE_WALL',
      'AGGRESSIVE_PLAYER',
      'AGGRESSIVE_TURRET',
      'DEAD'
    ];

   if (estadosBloqueados.includes(this.fsm.actual)) {
      return;
    }
     // 2. Calcular velocidad y determinar animación base
     const { x, y } = this.velocidad;
    const velocidad = Math.hypot(x, y);

    let base;
    if (velocidad > this.velRapida * 0.4) {
    base = 'correr';
  } else if (velocidad > 0.5) {
    base = 'caminar';
  } else {
    base = 'idle';
  }
   const key = this._animKey(base);
    this.cambiarAnimacion(key);

    // 3. Si va muy lento, no hace falta tocar el flip
    if (velocidad <= 1.0) return;

     // 4. Normalizar ángulo
      const anguloNormalizado = ((this.angulo % 360) + 360) % 360;

      // 5. Obtener sprite actual

       const sprites = this.spritesAnimados;
       const animActual = this._animActual;

        const spriteActual = sprites[animActual];

        
         // 6. Flip horizontal según ángulo
        if(anguloNormalizado > 135 && anguloNormalizado <= 225){
          spriteActual.scale.x = -1;
        }
        else{
          spriteActual.scale.x = 1;
        }

  }


  setAtaqueAnimAndFlip() {
    const personaje = this;
    // Si no hay punto de contacto aún, usar algún default
    const puntoDeContactoActual = personaje.puntoContacto;
    
    let resultado;

    if(puntoDeContactoActual){
      resultado = this._resolverAtaqueConPunto(puntoDeContactoActual);
    } 
    else{
      resultado = this._resolverAtaquePorAngulo();
    }
    this._aplicarAnimacionAtaque(resultado);
  }



  _resolverAtaqueConPunto(puntoContacto) {
  const personaje = this;

  const diferenciaEnX = puntoContacto.x - personaje.posicion.x;
  const diferenciaEnY = puntoContacto.y - personaje.posicion.y;

  const resultado = {
    anim: '',
    flipX: 1
  };

  // ¿Golpe horizontal o vertical?
  if (Math.abs(diferenciaEnX) >= Math.abs(diferenciaEnY)) {
    // --- HORIZONTAL ---
    resultado.anim = 'atacarIzquierda';

    if (diferenciaEnX > 0) {
      // objetivo a la derecha → espejado
      resultado.flipX = -1;
    } else {
      // objetivo a la izquierda
      resultado.flipX = 1;
    }

    return resultado;
  }

  // --- VERTICAL ---
  if (diferenciaEnY < 0) {
    resultado.anim = 'atacarArriba';
  } else {
    resultado.anim = 'atacarAbajo';
  }

  resultado.flipX = 1; // en vertical no espejamos
  return resultado;
}


_resolverAtaquePorAngulo() {
  const personaje = this;
  const angulo = ((personaje.angulo % 360) + 360) % 360;

  const resultado = {
    anim: '',
    flipX: 1
  };

  // Mirando a la izquierda
  if (angulo > 140 && angulo <= 220) {
    resultado.anim = 'atacarIzquierda';
    resultado.flipX = 1;
    return resultado;
  }

  // Mirando arriba
  if (angulo > 50 && angulo <= 130) {
    resultado.anim = 'atacarArriba';
    resultado.flipX = 1;
    return resultado;
  }

  // Mirando a la derecha (mismo sprite que izquierda, pero espejado)
  if (angulo > 310 || angulo <= 50) {
    resultado.anim = 'atacarIzquierda';
    resultado.flipX = -1;
    return resultado;
  }

  // Si no cayó en ninguno de los anteriores, está abajo
  resultado.anim = 'atacarAbajo';
  resultado.flipX = 1;
  return resultado;
}

_aplicarAnimacionAtaque(resultado) {
  const personaje = this;
  const animName = resultado.anim;



   // Si ya está esa anim puesta, solo ajustamos el flip y salimos
  if (personaje._animActual === animName) {
    const spriteActual = personaje.spritesAnimados[personaje._animActual];
    if (spriteActual) {
      spriteActual.scale.x = resultado.flipX;
    }
    return;
  }

  personaje.cambiarAnimacion(resultado.anim);

  const sprites = personaje.spritesAnimados;
  const spriteActual = sprites[personaje._animActual];

  if (spriteActual) {
     spriteActual.loop = true;  
     spriteActual.animationSpeed = spriteActual.animationSpeed || 0.4;
     spriteActual.play();
    spriteActual.scale.x = resultado.flipX;
  }
}

  atacarTorreta(per, torretaObjetivo, dt) {
    if (per.cooldownAttack > 0) {
      per.cooldownAttack -= dt;
      return;
    }
    per.setAtaqueAnimAndFlip();
    // Aplicar daño
    torretaObjetivo.recibirDaño(per.dañoJugador);
    // Reiniciar cooldown
    per.cooldownAttack = per.ritmoGolpesJugador || 0.6;

    // Cambiar animación de ataque
    per.cambiarAnimacion(per._animKey('atacar') || 'atacarIzquierda');
  }

  moverHacia(dest, vel, dt) {
    const pos = this.posicion;
    const dir = { x: dest.x - pos.x, y: dest.y - pos.y };
    const ang = anguloHacia(pos.x, pos.y, dest.x, dest.y);
    this.angulo = radianesAGrados(ang);

    const mov = setearMagnitudAVector(dir, vel * dt);
    this.velocidad.x = mov.x;
    this.velocidad.y = mov.y;

    if (this._moverConColision) this._moverConColision(dt);
    this._movedWithCollision = true;
  }


}