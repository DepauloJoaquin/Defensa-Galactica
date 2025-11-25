class EstadoAggressiveWall extends Estado {
  enter() {
    const p = this.personaje;


    // En este estado asumimos que siempre hay personaje y punto de contacto.
     // Si falta algo, no tiene sentido este estado
  if (!p || !p.puntoContacto || !p.muroBloqueo) return;



     // Reiniciamos el cooldown de ataque
    p.cooldownAttack = 0;


    // Tiempo mínimo "pegado" al muro antes de poder despegarse
    p._wallStick = 0.25;


    // Aseguramos que mire hacia el muro
    const pc  = p.puntoContacto;
    const pos = p.posicion;
    const ang = anguloHacia(pos.x, pos.y, pc.x, pc.y);
    p.angulo = radianesAGrados(ang);


    // Configura animación y flip de ataque según la orientación actual
    p.setAtaqueAnimAndFlip();


  
  }

  update(dt) {
    const p = this.personaje;

    if (!p || !p.puntoContacto) return;

     p.velocidad.x = 0;
    p.velocidad.y = 0;
    p.aceleracion.x = 0;
    p.aceleracion.y = 0;


     // 2) Manejar lógica de ataque (si está a rango y sin cooldown)
    this.procesarAtaqueAlMuro(p, dt);


     // 3) Gestionar el tiempo de “pegado” al muro
    //    Si todavía tiene pegado, no salimos de este estado.
    if (this.gestionarPegado(p, dt)) return;


     // 4) Cuando ya no está pegado, decidimos el siguiente estado
    this.decidirSiguienteEstado(p);
  }




  // =================== MÉTODOS AUXILIARES ===================

  // Desplaza al alien algunos píxeles a lo largo del muro
  // para que no se amontonen todos en el mismo punto.

  desplazarALoLargoDelMuro(personaje) {
    const posicion = personaje.posicion;
    const puntoDeContacto = personaje.puntoContacto;

    //Calcula el vector desde el punto de contacto hasta la posición del alien:
    const vectorDesdeContactoX = posicion.x - puntoDeContacto.x;
    const vectorDesdeContactoY = posicion.y - puntoDeContacto.y;

     // Distancia entre esos puntos
     let distancia = Math.hypot(vectorDesdeContactoX, vectorDesdeContactoY);
     if (distancia === 0) distancia = 0.0001; // evitar división por cero

     // Vector normalizado (dirección desde el muro hacia la entidad)para que el vector original no afecte al tamaño del movimiento.

     const normalX = vectorDesdeContactoX / distancia;
     const normalY = vectorDesdeContactoY / distancia;


       // Vector tangente a la pared (perpendicular a la normal)
        const tangenteX = -normalY;
        const tangenteY =  normalX;


        // Desplazamiento aleatorio entre -9 y 9 píxeles a lo largo de la pared
        const desplazamientoALoLargo = (Math.random() * 18) - 9;

        // Mover la posición a lo largo de la pared
         posicion.x += tangenteX * desplazamientoALoLargo;
        posicion.y += tangenteY * desplazamientoALoLargo;
  }

       // Mantiene al alien orientado hacia el muro y le da
      // un pequeño empujón constante hacia el punto de contacto.

      alinearConMuroYEmpujar(personaje, dt) {
    const posicion = personaje.posicion;
    const puntoContacto = personaje.puntoContacto;
    const velocidad = personaje.velocidad;

    // Ángulo hacia el punto de contacto del muro (en radianes)
    const ang = anguloHacia(
      posicion.x, posicion.y,
      puntoContacto.x, puntoContacto.y
    );

    // Lo guardamos en grados porque el sistema lo usa así
    personaje.angulo = ang * 180 / Math.PI;


    // Vector de movimiento con magnitud fija hacia el muro
    const mov = setearMagnitudAVector(
      {
        x: puntoContacto.x - posicion.x,
        y: puntoContacto.y - posicion.y
      },
      20 * dt
    );
    velocidad.x = mov.x;
    velocidad.y = mov.y;
  }


  // Se encarga de decidir si el alien pega al muro,
  // actualizando cooldown y animación de ataque.


   procesarAtaqueAlMuro(personaje, dt) {
    // Reducimos el cooldown con el paso del tiempo
    personaje.cooldownAttack -= dt;

    const puedeAtacar = this.estaEnRangoDeAtaque(personaje);

    // Si no está en rango o todavía tiene cooldown, no hace nada
    if (!puedeAtacar || personaje.cooldownAttack > 0) return;

    const muro = personaje.muroBloqueo;
     if (!muro) {
    return;
  }
    const daño = personaje.dañoPared || 10;
    const ritmo = personaje.ritmoGolpesPared || 0.4;

    muro.recibirDaño(daño);

    // Reiniciamos el cooldown según el ritmo de golpes
    personaje.cooldownAttack = ritmo;

    // Forzamos la animación de ataque (por si cambia el frame)
   
  }


  // Devuelve true si el alien está lo bastante cerca del muro como para atacar


  estaEnRangoDeAtaque(personaje) {
     const posicion = personaje.posicion;
    const puntoContacto = personaje.puntoContacto;
    if (!puntoContacto) 
      return false;


    const vectorDesdeContactoX = posicion.x - puntoContacto.x;
    const vectorDesdeContactoY = posicion.y - puntoContacto.y;
    const distancia = Math.hypot(vectorDesdeContactoX, vectorDesdeContactoY);

    // Prioridad: rangoAtaqueMuro > radioColisionMuro > radio normal
    const rangoAtaque =
      personaje.radioAtaqueMuro ||
      personaje.radioColisionMuro ||
      personaje.radio;

    return distancia <= rangoAtaque;
  }


  // Maneja el “pegado” al muro.
  // Devuelve true si todavía debe seguir pegado (y por lo tanto
  // no debe salir del estado).

    gestionarPegado(personaje, dt) {
    // Si el sistema externo lo marcó como bloqueado,
    // seguimos renovando el pegado.
    if (personaje.bloqueado) {
      personaje._wallStick = 0.25;
      return true;
    }

    // Consumimos el tiempo de pegado
    personaje._wallStick -= dt;

    // Mientras siga siendo positivo, no salimos del estado
    return personaje._wallStick > 0;
  }
    // Decide a qué estado pasar cuando el alien deja de estar pegado al muro.
  decidirSiguienteEstado(personaje) {
    const juego = personaje.juego;
    const protagonista =  juego.protagonista;
    const mundo = juego.mundo;
    const base =  mundo.base;

    // Si hay base, reactivamos el comportamiento de ir hacia la base
    if (base) {
      personaje._approachBase = true;
      personaje._baseTarget = {
        x: base.posicion.x,
        y: base.posicion.y,
      };
    }

    // Si no hay protagonista, caemos a un estado “consciente” genérico
    if (!protagonista || !protagonista.posicion) {
      this.fsm.setear('AWARE');
      return;
    }

    // Distancia al protagonista para decidir ALERTA o INTRIGADO
    const posJugador = protagonista.posicion;
    const d2 = dist2(
      personaje.posicion.x, personaje.posicion.y,
      posJugador.x, posJugador.y
    );

    this.fsm.setear(
      d2 < personaje.rangoAlertaCuad ? 'ALERTA' : 'INTRIGADO'
    );
  }
}

