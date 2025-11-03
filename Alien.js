class Alien extends GameObject{
   constructor(texture, x, y, juego) {
    super(texture, x, y, juego);

    this.vision = Math.random() * 200 + 1800;
    this.pesoAlinear = 1.0;
    this.pesoReunion = 0.7;
    this.pesoSeparacion = 1.2;
    this.radioDePercepcion = 100;
    this.radio = 14;
    this.velocidad={x:0,y:0};
    this._framesBloqueado = 0;

    this.vidaMaxima = 100;
    this.vida = this.vidaMaxima;
    this.vivo = true;
    // velocidades
     this.velLenta=60; 
     this.velMedia=100;
     this.velRapida=160;

    // rangos (guardar ^2 para comparar sin raizCuadrada)
    this.rangoAware = 350;                              
    this.rangoIntrigado = 240;
    this.rangoAlerta = 150;
    this.rangoAtaqueJugador=28;
    this.rangoAwareCuad= this.rangoAware**2;
    this.rangoIntrigadoCuad=this.rangoIntrigado**2;
    this.rangoAlertaCuad=this.rangoAlerta**2;
    this.rangoAtaqueJugadorCuad=this.rangoAtaqueJugador**2;

    //combate
    this.dañoPared=10;
    this.dañoJugador=8;
    this.ritmoGolpesPared=0.40;
    this.ritmoGolpesJugador=0.60;
    this.cooldownAttack=0;

    //colision
    this.bloqueado = false;
    this.muroBloqueo=null;
    this.puntoContacto=null;

    //FSM
    this.fsm=new FSM(this);
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
    return this.juego.aliens;
  }

  aplicarComportamiento(){

      /*
      this.buscarObstaculosCerca();
      this.escapar();
      this.perseguir();
      this.multitud(this.juego.aliens);
      */
     if (!this.fsm || !this.fsm.actual) return;
      const st = this.fsm.actual;  

      // Ejemplo: boids solo en IDLE/AWARE/INTRIGADO
  if (['IDLE','AWARE','INTRIGADO'].includes(st)) {
    this.buscarObstaculosCerca();
    this.multitud(this.juego.aliens);
     
  }
}

  asignarTarget(quien){
    this.target = quien;
    }

    perseguir(){
        if(!this.target) return;

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


  recibirDaño(cantidad = 10){
    if(!this.vivo) return;

    this.vida -= cantidad;

    if (this.container) {
    this.container.alpha = 0.6;
    setTimeout(() => { if (this.container) this.container.alpha = 1; }, 60);
  }
   if (this.vida <= 0) this.morir();
  }

  morir(){
    if(!this.vivo) return;
    this.vivo = false;
     const j = this.juego;
     
  j.aliens = j.aliens.filter(a => a !== this);
  j.personajes = j.personajes.filter(p => p !== this);

  // limpiar del stage
  if (this.container?.parent) this.container.parent.removeChild(this.container);
  this.container?.destroy?.({ children: true });

  }

 buscarObstaculosCerca({ margenFactor = 10 } = {}){ // (corrijo nombre si era “margen”)
  this.obstaculosCerca = [];
  this.obstaculosQueEstoyColisionando = [];
  const { x, y } = this.posicion;

  for (const obstaculo of this.juego.obstaculos){
    if (!obstaculo) continue;

    let centro = null;
    if (typeof obstaculo.getPosicionCentral === 'function')      centro = obstaculo.getPosicionCentral();
    else if (obstaculo.posicion)                                 centro = obstaculo.posicion;
    else if (obstaculo.sprite)                                   centro = obstaculo.sprite.position;
    else continue;

    const distancia = calcularDistancia({x,y}, centro);
    const distanciaDeColision   = this.radio + (obstaculo.radio ?? 0);
    const distanciaDeTolerancia = distanciaDeColision + this.radio * (margenFactor ?? 10);

    if (distancia >= distanciaDeTolerancia) continue;

    if (distancia < distanciaDeColision){
      this.obstaculosQueEstoyColisionando.push(obstaculo);
      continue;
    }
    this.obstaculosCerca.push(obstaculo);
  }
}



  moverHaciaJugador(dt,vel){
    if(!this.juego|| !this.juego.protagonista|| !this.juego.protagonista.posicion){
      return;
    }
    const posicionAlien = this.posicion;
    const posicionProta = this.juego.protagonista.posicion;

    // Vector hacia el jugador
     const direccion = { x: posicionProta.x - posicionAlien.x, y: posicionProta.y - posicionAlien.y };

     // Orientación
     const ang = anguloHacia(posicionAlien.x, posicionAlien.y, posicionProta.x, posicionProta.y);
     this.angulo = radianesAGrados(ang);

     // Calculo el movimiento que hará este frame
     const movimiento = setearMagnitudAVector(direccion, vel * dt);
     // Aplico movimiento a la velocidad
     this.velocidad.x = movimiento.x;
     this.velocidad.y = movimiento.y;

     if(this._moverConColision) this._moverConColision(dt);
     this._movedWithCollision = true; 

       if (this.fsm && ['IDLE', 'AWARE', 'INTRIGADO', 'ALERTA'].includes(this.fsm.actual)){
    

       }
  }

 _moverConColision(dt){
  const desplazamientoX = this.velocidad.x;
  const desplazamientoY = this.velocidad.y;

  this.bloqueado = false;
  this.muroBloqueo = null;
 // this.puntoContacto = null;
 const enPegado = this.fsm?.actual === 'AGGRESSIVE_WALL';
 if (!enPegado) {
  this.puntoContacto = null;
  }

  // Movimiento en eje X
  const nuevaPosX = this.posicion.x + desplazamientoX;
  if(this.juego && this.juego.hayColisionEntreMuroYAlien){
    const colisionXsiHay = this.juego.hayColisionEntreMuroYAlien(nuevaPosX,this.posicion.y,this.radio);

    if(!colisionXsiHay){
      this.posicion.x = nuevaPosX;
    } else {
      this.velocidad.x = 0;
      this.bloqueado = true;
      this.muroBloqueo = colisionXsiHay.muro;
      this.puntoContacto = colisionXsiHay.puntoContacto;  // <--
    }
    this._framesBloqueado = this.bloqueado ? (this._framesBloqueado + 1) : 0;

  }

  // Movimiento en eje Y
  const nuevaPosY = this.posicion.y + desplazamientoY;
  if(this.juego && this.juego.hayColisionEntreMuroYAlien){
    const colisionYSiHay = this.juego.hayColisionEntreMuroYAlien(this.posicion.x,nuevaPosY,this.radio);

    if(!colisionYSiHay){
      this.posicion.y = nuevaPosY;
    } else {
      this.velocidad.y = 0;
      this.bloqueado = true;
      // si no había muro de bloqueo aún, guardo este
      if(!this.muroBloqueo){
        this.muroBloqueo = colisionYSiHay.muro;
        this.puntoContacto = colisionYSiHay.puntoContacto; // <--
      }
    }
  }

  // === SEPARACIÓN FINAL (PUSH-BACK SUAVE) ===
  // Si estoy bloqueado y tengo punto de contacto, me corro un pelín
  if (this.bloqueado && this.puntoContacto){
    const dx = this.posicion.x - this.puntoContacto.x;
    const dy = this.posicion.y - this.puntoContacto.y;
    let d = Math.hypot(dx, dy);

    // si quedó exactamente encima del punto, evitamos NaN
    if (d < 0.0001) { d = 0.0001; }

    // normal desde el punto del muro hacia el centro del alien
    const nx = dx / d;
    const ny = dy / d;

    // dejo el centro del alien justo fuera del muro (radio + epsilon)
    const EPS = 0.5;
    this.posicion.x = this.puntoContacto.x + nx * (this.radio + EPS);
    this.posicion.y = this.puntoContacto.y + ny * (this.radio + EPS);
  }

  if (this.fsm?.actual === 'AGGRESSIVE_WALL') {
  // si hay contacto real este frame, lo cacheamos
  if (this.puntoContacto) {
     this._lastPuntoContacto = { x: this.puntoContacto.x, y: this.puntoContacto.y };
    this._puntoContactoGrace = 0.2; // 200 ms de gracia
   } else if (this._lastPuntoContacto && (this._puntoContactoGrace ?? 0) > 0) {
     // usamos el último durante la gracia
     this._puntoContactoGrace -= dt ?? 0;
     this.puntoContacto = { x: this._lastPuntoContacto.x, y: this._lastPuntoContacto.y };
   }
 } else {
   this._lastPuntoContacto = null;
   this._puntoContactoGrace = 0;
 }
}

  tick(dt){
    const deltaTime = this.juego.pixiApp.ticker.deltaMS / 1000;
    if(!this.vivo && this.fsm.actual !== 'DEAD') 
      this.fsm.setear("DEAD");
      this.fsm.update(dt);
      super.tick(dt);
     
  }


 _animDirFromAngle(){
  const a = ((this.angulo % 360) + 360) % 360;

  // 0° = derecha (espejada), 90° = arriba, 180° = izquierda, 270° = abajo
  if (a > 140 && a <= 220) return 'Izquierda';  // izquierda real
  if (a > 50 && a <= 130) return 'Arriba';
  if (a > 310 || a <= 50)  return 'Izquierda';  // derecha espejada
  return 'Abajo';
}
_animKey(base){ // base puede ser 'idle', 'caminar', 'correr', 'atacar'
  return `${base}${this._animDirFromAngle()}`;
}

cambiarDeSpriteAnimadoSegunAngulo(){
  // no pisar anim si está atacando o muerto
  if (this.fsm && (this.fsm.actual === 'AGGRESSIVE_WALL' ||
                   this.fsm.actual === 'AGGRESSIVE_PLAYER' ||
                   this.fsm.actual === 'AGGRESSIVE_TURRET' ||  
                   this.fsm.actual === 'DEAD')) {
    return;
  }

  const speed = Math.hypot(this.velocidad.x, this.velocidad.y);
  const base = speed > (this.velRapida*0.4) ? 'correr'
             : speed > 0.5 ? 'caminar'
             : 'idle';

  const key = this._animKey(base);
  this.cambiarAnimacion(key);

  if (speed > 1.0) {
  const a = ((this.angulo % 360) + 360) % 360;
  const sp = this.spritesAnimados?.[this._animActual];
  if (sp) sp.scale.x = (a > 135 && a <= 225) ? -1 : 1;
  }
}


setAtaqueAnimAndFlip(){
  const p = this;
  // si no hay punto de contacto aún, dejá algún default
  const pc = p.puntoContacto;
  let anim;

  if (pc) {
    const dx = pc.x - p.posicion.x;
    const dy = pc.y - p.posicion.y;

    // ¿golpe horizontal o vertical?
    if (Math.abs(dx) >= Math.abs(dy)) {
      // horizontal: siempre usar anim de "izquierda" y flippear si el muro está a la derecha
      anim = 'atacarIzquierda';
      p.cambiarAnimacion(anim);
      const sp = p.spritesAnimados?.[p._animActual];
      if (sp) sp.scale.x = (dx > 0 ? -1 : 1); // muro a la derecha => flip -1
      return;
    } else {
      // vertical
      anim = (dy < 0) ? 'atacarArriba' : 'atacarAbajo';
    }
  }else{
     const a = ((p.angulo % 360) + 360) % 360;
  if (a > 140 && a <= 220) {
     anim = 'atacarIzquierda';
     p.cambiarAnimacion(anim);
    const sp = p.spritesAnimados?.[p._animActual];
     if (sp) sp.scale.x = 1; // izquierda real
     return;
   } else if (a > 50 && a <= 130) {
     anim = 'atacarArriba';
   } else if (a > 310 || a <= 50) {
     anim = 'atacarIzquierda';
     p.cambiarAnimacion(anim);
     const sp = p.spritesAnimados?.[p._animActual];
     if (sp) sp.scale.x = -1; // mirando derecha → flip horizontal
     return;
   } else {
     anim = 'atacarAbajo';
   }
  }
   p.cambiarAnimacion(anim);
  const sp = p.spritesAnimados?.[p._animActual];
  if (sp) sp.scale.x = 1; // en vertical no espejamos
}

atacarTorreta(per,torretaObjetivo,dt){
  if(per.cooldownAttack > 0){
    per.cooldownAttack -= dt;
    return;
  }
   per.setAtaqueAnimAndFlip?.();     
  // Aplicar daño
  torretaObjetivo.recibirDaño?.(per.dañoJugador);
   // Reiniciar cooldown
   per.cooldownAttack = per.ritmoGolpesJugador || 0.6;

   // Cambiar animación de ataque
   if (per?.cambiarAnimacion) per.cambiarAnimacion(per._animKey?.('atacar') || 'atacarIzquierda');
}



moverHacia(dest, vel, dt){
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