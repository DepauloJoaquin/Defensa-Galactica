class Mundo{
    constructor(app,config,juego){
        this.app = app;
        this.config = config;
         this.juego = juego;  

        //Medidas del mapa
         this.anchoDelMapa = config.mapa.ancho;
         this.altoDelMapa  = config.mapa.alto;

         
        // Contenedor principal del mundo
         this.container = new PIXI.Container();
         this.app.stage.addChild(this.container);

        // Entidades
         this.personajes = [];
         this.aliens     = [];
         this.torretas   = [];
         this.obstaculos = [];
         this.muros      = [];
         this.balas      = [];

        // Referencias importantes
         this.protagonista = null;
         this.base         = null;

         // Cámara / zoom
         this.zoom = 1;
         this.minZoom = config.zoom.min;
         this.maxZoom = config.zoom.max;
         this.zoomStep = config.zoom.step;
         this.targetCamara = null;

        // Mouse en coords de pantalla
        this.mouse = { posicion: { x: 0, y: 0 } };

        // HUD de vida base
         
          
    }




     // ========== COLISIÓN MURO / ALIEN ==========

       hayColisionEntreMuroYAlien(alienX, alienY, alienRadio) {
    // 1) convertir posición del alien (mundo) a GLOBAL
    const pGlobal = this.container.toGlobal(new PIXI.Point(alienX, alienY));

    // 2) el radio debe escalarse igual que el mundo (zoom actual)
    const escala = this.container.scale.x || 1;
    const alienRadioGlobal  = alienRadio * escala;
    const alienRadioGlobal2 = alienRadioGlobal * alienRadioGlobal;

    for (const muro of this.muros) {
      // Bounds del muro ya están en GLOBAL
      const cajaMuro = muro.cajaAlineadaAEjesMuro();

      // Punto más cercano de la AABB al punto del alien (todo en GLOBAL)
      const puntoXMuroMasCercanoAlien = Math.max(
        cajaMuro.x,
        Math.min(pGlobal.x, cajaMuro.x + cajaMuro.width)
      );
      const puntoYMuroMasCercanoAlien = Math.max(
        cajaMuro.y,
        Math.min(pGlobal.y, cajaMuro.y + cajaMuro.height)
      );

      const distanciax = pGlobal.x - puntoXMuroMasCercanoAlien;
      const distanciay = pGlobal.y - puntoYMuroMasCercanoAlien;
      const distanciaCuad = distanciax * distanciax + distanciay * distanciay;

      if (distanciaCuad <= alienRadioGlobal2) {
        // Volvemos el punto de contacto a coords del MUNDO (container)
        const puntoContactoMundo = this.container.toLocal(
          new PIXI.Point(puntoXMuroMasCercanoAlien, puntoYMuroMasCercanoAlien)
        );

        return {
          hayColision: true,
          muro,
          puntoContacto: {
            x: puntoContactoMundo.x,
            y: puntoContactoMundo.y,
          },
        };
      }
    }
    return false;
  }



  // ========== TORRETAS ==========

   buscarTorretaCercana(pos) {
    let minD2 = Infinity;
    let objetivo = null;

    for (const torreta of this.torretas) {
      if (!torreta) continue;
      if (torreta.vivo === false) continue;

      const torretaPosicion = torreta.container.position;
      if (!torretaPosicion) continue;

      const dx = pos.x - torretaPosicion.x;
      const dy = pos.y - torretaPosicion.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < minD2) {
        minD2 = d2;
        objetivo = torreta;
      }
    }
    return objetivo;
  }

   registrarTorreta(torreta) {
    if (!torreta) return;
    this.torretas.push(torreta);
  }

  
  eliminarTorreta(torreta) {
    this.torretas = this.torretas.filter(t => t !== torreta);
  }

     /** Llamar una vez al arrancar el juego */
  async init() {
    await this.cargarTexturas();
    await this.crearFondo();

    this.crearBase();
   
    await this.preloadErizoCheco();
    //this.crearErizosRandom();
  }

    /** Se llama una vez por frame desde Juego */
  update(dt,keys) {
    // actualizar personajes (prota, aliens, muros con lógica, etc.)
  this.actualizarPersonajes(dt,keys);
  this.actualizarTorretas(dt);
  this.actualizarBalas(dt);
  this.actualizarCamara(dt);
  this.actualizarUIBase();
}




    actualizarPersonajes(dt,keys) {
  for (const personaje of this.personajes) {
    if(personaje && personaje.tick){
        personaje.tick(dt,keys,this)
    }
  }
}


  actualizarTorretas(dt) {
  for (const torreta of this.torretas) {
    if (torreta && torreta.update) {
      torreta.update(dt);
    }
  }
}

    actualizarUIBase() {
   if (!this.base) return;
  if (this.base.muerto) {
    this.baseBarraDeVida.clear();
    return;
  }
  this.dibujarBarraVidaBase();
}


async cargarTexturas() {
  await PIXI.Assets.load("img/mapa_1_dis.png");
  PIXI.Assets.add({ alias: 'naveBase', src: 'img/Nave1.2.png' });
  PIXI.Assets.add({alias: "muroBunker",src:"img/muro.png"});
  await PIXI.Assets.load('naveBase');
  await PIXI.Assets.load(['naveBase', 'muroBunker']);
  
}

async crearFondo() {
  this.fondo = new PIXI.TilingSprite(await PIXI.Assets.load("img/mapa_1_dis.png"));
  this.fondo.zIndex = -999999999999999999999;
  this.fondo.tileScale.set(0.5);
  this.fondo.width  = this.anchoDelMapa;
  this.fondo.height = this.altoDelMapa;
  this.container.addChild(this.fondo);
    
    }
    crearBase(){
         // 1) Cargar la textura de la base
         const texturaBase =  PIXI.Texture.from('naveBase');

         // 2) Calcular posición de la base (centrada abajo del mapa)
         const centroX = this.anchoDelMapa / 2;
         const posicionY = this.altoDelMapa - 140;


          // 3) Crear el objeto base (Muro)
         const base = new Muro(texturaBase, centroX, posicionY, this);

         // 4) Centrar el sprite (que el punto 0,0 esté en el medio)
         base.sprite.anchor.set(0.5);

         // 5) Escala fija
         base.sprite.scale.set(0.6);

         // 6) Vida de la base
          base.vida = 2500;
          base.maxVida = 2500;
           base.muerto  = false; 

         // 7) Orden de dibujado (para el z-index)
         base.sprite.zIndex = base.posicion.y;

         // 8) Rotar 90 grados (si la imagen está “acostada”)
          base.sprite.rotation = Math.PI / 2;

         // 9) Guardar la base en el mundo
          this.base = base;


          this.personajes.push(base);
          this.muros.push(base);
          base.render();  

           this.baseBarraDeVida = new PIXI.Graphics();
           base.sprite.addChild(this.baseBarraDeVida);

         // 10) Activar ordenamiento por zIndex
          this.container.sortableChildren = true;

         // 10) Activar ordenamiento por zIndex
         this.container.sortableChildren = true;
        


    }


     crearProtagonista(textureData) {
     const x = this.anchoDelMapa / 2;
     const y = this.altoDelMapa / 2;
     const protagonista = new PersonajePPal(textureData, x, y, this);
     this.personajes.push(protagonista);
     this.protagonista = protagonista;
     this.targetCamara = protagonista;
    }


  crearBunkerPerimetral(textureData, { ladoTiles = 9 } = {}) {
  const Escala = Muro.SCALE;

  const temporal = new PIXI.Sprite(textureData);
  temporal.anchor.set(0.5);
  temporal.scale.set(Escala);

  const anchoTileReal = temporal.width;
  const altoTileReal  = temporal.height;
  temporal.destroy();

  const FACTOR_SOLAPE = 0.60;

  const pasoHorizontal = anchoTileReal * FACTOR_SOLAPE;
  const pasoVertical   = anchoTileReal * FACTOR_SOLAPE;

  // 👉 ajustes finos (tócalos si ves desalineación)
  const OFFSET_LATERAL_X = 55;  // mueve los muros laterales hacia fuera/ dentro
  const OFFSET_ABAJO_Y   = -25;  // mueve la fila de abajo un poco

  const centroX = this.protagonista.posicion.x;
  const centroY = this.protagonista.posicion.y;

  const cantidad = ladoTiles;

  const mitadDeAncho = ((cantidad - 1) / 2) * pasoHorizontal;
  const mitadDeAlto  = ((cantidad - 1) / 2) * pasoVertical;

  const bordeIzquierdaX = centroX - mitadDeAncho;
  const bordeDerechoX   = centroX + mitadDeAncho;
  const bordeSuperiorY  = centroY - mitadDeAlto;
  const bordeInferiorY  = centroY + mitadDeAlto;

  // ---------- FILAS: ARRIBA Y ABAJO ----------
  for (let i = 0; i < cantidad; i++) {
    const x = bordeIzquierdaX + i * pasoHorizontal;

    // Arriba (normalmente está bien, lo dejo sin offset)

      

    {
      const muro = new Muro(textureData, x, bordeSuperiorY, this);
      this.personajes.push(muro);
      muro.sprite.anchor.set(0.5);
      muro.sprite.rotation = 0;
      muro.posicion.x = x;
      muro.posicion.y = bordeSuperiorY;
      muro.sprite.zIndex = bordeSuperiorY;
      muro.render();
    }

    // Abajo (un poco ajustado)
    {
      const yAbajo = bordeInferiorY + OFFSET_ABAJO_Y;

      const muro = new Muro(textureData, x, yAbajo, this);
      this.personajes.push(muro);
      muro.sprite.anchor.set(0.5);
      muro.sprite.rotation = 0;
      muro.posicion.x = x;
      muro.posicion.y = yAbajo;
      muro.sprite.zIndex = yAbajo;
      muro.render();
    }
  }

  // ---------- COLUMNAS: IZQUIERDA Y DERECHA ----------
  

  for (let i = 1; i < cantidad - 1; i++) {
    const yBase = bordeSuperiorY + i * pasoVertical;

    const OFFSET_LATERAL_Y = 10;  // 🔹 súbelo o bájalo a gusto

     const yLateral = yBase - OFFSET_LATERAL_Y;
    

    // Izquierda
    {
      const xIzq = bordeIzquierdaX - OFFSET_LATERAL_X;

      const muro = new Muro(textureData, xIzq, yLateral, this);
      this.personajes.push(muro);
      muro.sprite.anchor.set(0.5);
      muro.sprite.rotation = Math.PI / 2;
      muro.posicion.x = xIzq;
      muro.posicion.y =  yLateral;
      muro.sprite.zIndex =  yLateral;
      muro.render();
    }

    // Derecha
    {
      const xDer = bordeDerechoX + OFFSET_LATERAL_X;

      const muro = new Muro(textureData, xDer,  yLateral, this);
      this.personajes.push(muro);
      muro.sprite.anchor.set(0.5);
      muro.sprite.rotation = Math.PI / 2;
      muro.posicion.x = xDer;
      muro.posicion.y =  yLateral;
      muro.sprite.zIndex =  yLateral;
      muro.render();
    }
  }

  this.container.sortableChildren = true;
}






    //Obstáculos

     async preloadErizoCheco() {
     PIXI.Assets.add({ alias: 'erizoCheco', src: 'img/erizo checo.png' });
     await PIXI.Assets.load('erizoCheco');
    }

     crearErizosRandom() {
     for (let i = 0; i < 100; i++) {
      const erizo = new ErizoCheco(
      Math.random() * this.anchoDelMapa,
      Math.random() * this.altoDelMapa,
      this,
      0.05
    );
    this.obstaculos.push(erizo);
     }
    }

    // Balas del protagonista
    dispararProtagonista() {
         if (!this.protagonista) return;

         // 1) Mouse en coordenadas del mundo (no de la pantalla)

         var posicionMouseMundo = this.screenToWorld(this.mouse.posicion);

      

          // 2) Posición del protagonista
          const posicionProtagonistaX = this.protagonista.posicion.x;
          const posicionProtagonistaY = this.protagonista.posicion.y;

         // 3) Dirección del disparo (del prota hacia el mouse)
          const direccionX = posicionMouseMundo.x - posicionProtagonistaX;
          const direccionY = posicionMouseMundo.y - posicionProtagonistaY;
          
          var longitudDireccion = Math.hypot(direccionX, direccionY);
         if (longitudDireccion === 0) {
        longitudDireccion = 1;
      }

        const dirNormX = direccionX / longitudDireccion;
        const dirNormY = direccionY / longitudDireccion;
    

      // Configuracion de la bala
      const configuracionBala = this.config.jugador.bala;

      const velocidadBala = configuracionBala.velocidad || 900;
      const dañoBala     = configuracionBala.daño      || 35;
      const vidaBala      = configuracionBala.vida      || 1.2;
      const radioBala     = configuracionBala.radio     || 4;


      // 5) Dibujo de la bala
      const graficoBala = new PIXI.Graphics();
      graficoBala.beginFill(0x8e44ad);
      graficoBala.drawCircle(0, 0, radioBala); 
      graficoBala.endFill();
      graficoBala.position.set(posicionProtagonistaX, posicionProtagonistaY);
      this.container.addChild(graficoBala);



       // 6) Crear la bala y guardarla
    const bala = {
    posicionX: posicionProtagonistaX,
    posicionY: posicionProtagonistaY,
    velocidadX: dirNormX * velocidadBala,
    velocidadY: dirNormY * velocidadBala,
    daño: dañoBala,
    vida: vidaBala,
    radio: radioBala,
    grafico: graficoBala
  };

  this.balas.push(bala);
    }

    actualizarBalas(dt){
        if (!this.balas || this.balas.length === 0) return;
         
        for (const bala of this.balas) {
        // 1) Actualizar vida y posición
            bala.vida -= dt;
            bala.posicionX += bala.velocidadX * dt;
            bala.posicionY += bala.velocidadY * dt;
        

         // 2) Mover el dibujito de la bala
        if (bala.grafico) {
             bala.grafico.position.set(bala.posicionX, bala.posicionY);
             bala.grafico.zIndex = bala.posicionY;
            }
        
        // Si ya está muerta, no chequeamos colisión
            if (bala.vida <= 0) continue;

         // 3) Colisión con aliens

         for (const alien of this.aliens) {
            if (!alien || !alien.vivo) continue;


            const direccionX = bala.posicionX - alien.posicion.x;
            const direccionY =  bala.posicionY - alien.posicion.y;
            const dist2 = direccionX * direccionX + direccionY * direccionY;

            const radioAlien = alien.radio || 14;

            if (dist2 <= radioAlien * radioAlien) {
                if (typeof alien.recibirDaño === "function") {
                alien.recibirDaño(bala.daño);
        }
        bala.vida = 0; // matar bala
        break;
      }
    }
 }  
    
     // 4) Eliminar balas muertas y limpiar gráficos
        this.balas = this.balas.filter((bala) => {
        if (bala.vida > 0) {
      return true; // se queda
    }
    

     // limpiar el gráfico
    if (bala.grafico && bala.grafico.parent) {
      bala.grafico.parent.removeChild(bala.grafico);
    }
     if (bala.grafico && typeof bala.grafico.destroy === "function") {
      bala.grafico.destroy();
    }
 return false; // se elimina del array
  });

  this.container.sortableChildren = true;

}
    

dibujarBarraVidaBase() {
  if (!this.base || !this.base.sprite) return;

  const sprite = this.base.sprite;
  const ratio  = clamp(this.base.vida / this.base.maxVida, 0, 1);

  const anchoDeBarra  = 220;
  const altoDeBarra   = 16;
  const diferenciaEnY = sprite.height * 0.5 + 20;

  const x =  - anchoDeBarra / 2;
  const y =  diferenciaEnY;

  const g = this.baseBarraDeVida;
  g.clear();


   g.position.set(sprite.x, sprite.y);
  g.rotation = sprite.rotation;



  g.beginFill(0x000000, 0.6);
  g.drawRoundedRect(
    -anchoDeBarra / 2 - 2,   // centrado
    diferenciaEnY - 2,
    anchoDeBarra + 4,
    altoDeBarra + 4,
    4
  );
  g.endFill();

   g.beginFill(colorVidaPorRatio(ratio));
  g.drawRoundedRect(
    -anchoDeBarra / 2,
    diferenciaEnY,
    anchoDeBarra * ratio,
    altoDeBarra,
    4
  );
 
  g.endFill();

  g.zIndex = (sprite.zIndex || sprite.y || 0) + 10;
  this.container.sortableChildren = true;
}

   // ----------------- Cámara -----------------

    actualizarCamara(dt) {
    if (!this.targetCamara) return;

    const targetPos = this.targetCamara.posicion || this.targetCamara.sprite.position;
    if (!targetPos) return;
    //Toma el tamaño de la pantalla
    const anchoPantalla = this.app.renderer.width;
    const altoPantalla = this.app.renderer.height;

   //Calcula el tamaño “visible” en el mundo según el zoom

    const tamañoVisibleDeMundoAncho = anchoPantalla / this.zoom;
    const tamañoVisibleDeMundoAlto = altoPantalla / this.zoom;

    //Centra la cámara en el objetivo (en coordenadas del mundo)

    let camX = targetPos.x - tamañoVisibleDeMundoAncho / 2;
    let camY = targetPos.y - tamañoVisibleDeMundoAlto / 2;


    //Evita que la cámara se salga del mapa

    camX = clamp(camX, 0, Math.max(0, this.anchoDelMapa - tamañoVisibleDeMundoAncho));
    camY = clamp(camY, 0, Math.max(0, this.altoDelMapa - tamañoVisibleDeMundoAlto));

    this.container.position.set(-camX * this.zoom, -camY * this.zoom);
    this.container.scale.set(this.zoom);
  }


  screenToWorld(pantalla) {
    if (!pantalla) return { x: 0, y: 0 };
    const pant = new PIXI.Point(pantalla.x, pantalla.y);
    return this.container.toLocal(pant);
  }


}


function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function colorVidaPorRatio(r) {
  if (r > 0.6) return 0x2ecc71;
  if (r > 0.3) return 0xf1c40f;
  return 0xe74c3c;
}

    
