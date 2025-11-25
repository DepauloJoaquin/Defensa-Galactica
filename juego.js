class Juego {

  constructor() {


    this.ancho = window.innerWidth;
    this.alto  = window.innerHeight;

   
    this.keys  = {};

    

    this.score = 0;
    this.metal = GAME_CONFIG.recursos.metalInicial ;

    this.fireRatePlayer = GAME_CONFIG.jugador.fireRate;
    this._fireCooldown  = 0;
    this._shooting      = false;
    
     this.torretas = [];     // 👈 importante para destruir()
     this.aliens   = []; 
  
  
  }



  async initPixi() {
 
    const opcionesDePixi = {
      background: "#1099bb",
      width: this.ancho,
      height: this.alto,
    };

    this.pixiApp = new PIXI.Application();
    await this.pixiApp.init(opcionesDePixi);
    this.pixiApp.stage.name = "al stage";

    document.body.appendChild(this.pixiApp.canvas);




    this.pixiApp.stage.eventMode = "static";
    this.pixiApp.stage.hitArea   = this.pixiApp.screen;
    this.pixiApp.stage.sortableChildren = true;

     // 2) Crear el Mundo

    this.mundo = new Mundo(this.pixiApp, GAME_CONFIG,this);
    await this.mundo.init();

    this.containerPrincipal = this.mundo.container;

     // 3) Cargar animaciones y crear protagonista
    const animacionesAlien     = await PIXI.Assets.load("img/alienDef.json");
    const animacionesPersonaje = await PIXI.Assets.load("img/protagonista2.json");

    this.mundo.crearProtagonista(animacionesPersonaje);

    const texturaMuro = PIXI.Texture.from('muroBunker');
    this.mundo.crearBunkerPerimetral(texturaMuro, { ladoTiles: 9 });

    // 4) WaveManager + Input + UI
     this.waveManager = new WaveManager(
      this.mundo,
      GAME_CONFIG.oleadas,
      animacionesAlien,
      this
    );

    this.input = new InputManager(this);

    await this.preloadTorretas();

    this.ui = new UIManager(
      this.pixiApp,
      this,
      this.mundo,
      this.waveManager,
      this.torretasTextures
    );

    this.ui.init(this.ancho, this.alto);

     if (this.waveManager.empezarPrimeraWave) {
  this.waveManager.empezarPrimeraWave();
}

    this.setupResizeHandler();


        // 5) Ticker principal
    this.pixiApp.ticker.add(this._onTick.bind(this));

  }

  _onTick() {
    const dt = this.pixiApp.ticker.deltaMS / 1000;
    this.mundo.update(dt,this.keys);
    this.waveManager.update(dt);
    this.actualizarDisparoProtagonista(dt);
    this.ui.update(dt);


    const start = performance.now();

const end = performance.now();
const delta = end - start;
console.log('Update tardó:', delta.toFixed(3), 'ms');
  }




   actualizarDisparoProtagonista(dt) {
   const protagonista = this.mundo.protagonista;
  if (!protagonista) return;

  // Actualizar cooldown
  if (this._fireCooldown > 0) {
    this._fireCooldown -= dt;
    return;
  }
  // Si no está disparando o aún hay cooldown, nada que hacer
  if (!this._shooting) return;

    this.mundo.dispararProtagonista();

    // Resetear cooldown
  this._fireCooldown = 1 / this.fireRatePlayer;
 
}


  /// Sumar puntaje
sumarPuntaje(cantidad = 1) {
  this.score = (this.score || 0) + cantidad;
  // Nada de this.scoreText acá: lo actualiza UIManager.update()
}

 
// Recursos: sumar metal
sumarMetal(cantidad = 1) {
  this.metal = (this.metal || 0) + cantidad;
  // Nada de this.metalText ni actualizarEstadoCostesUI
}

 // Compras
puedePagar(cost) {
  return (this.metal || 0) >= cost;
}

pagar(cost) {
  if (!this.puedePagar(cost)) return false;
  this.metal -= cost;
  // UIManager.actualizarHUD() actualiza textos y colores cada frame
  return true;
}
 

  async preloadTorretas() {

    const rutas = {
      torreBasica: 'img/turret_03b_mk3.png',
      torreSplash: 'img/turret_03_mk1.png',
      torreLenta: 'img/turret_02_mk1.png',
    };

    // valida que ninguna sea undefined/vacía:
    for (const [k, v] of Object.entries(rutas)) {
      if (typeof v !== 'string' || !v) throw new Error(`Ruta inválida para ${k}: ${v}`);
    }

    // Registra cada asset por alias y luego carga por alias
    for (const [alias, src] of Object.entries(rutas)) {
      PIXI.Assets.add({ alias, src });
    }
    await PIXI.Assets.load(Object.keys(rutas));

    // Guarda las texturas ya resueltas
    this.torretasTextures = {
      torreBasica: PIXI.Texture.from('torreBasica'),
      torreSplash: PIXI.Texture.from('torreSplash'),
      torreLenta: PIXI.Texture.from('torreLenta'),
    };

  };



  // ========= Pantalla de derrota =========
  onBaseDestroyed(customMessage) {
    if (this._derrotaMostrada) return;
    this._derrotaMostrada = true;

    // Crear overlay HTML (más simple que dentro de PIXI para interacción)
    const overlay = document.createElement('div');
    overlay.id = 'pantalla-derrota';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      zIndex: '100000'
    });

    const message = customMessage || 'La base fue destruida. Haz click para reiniciar.';
    overlay.innerHTML = `
      <div style="text-align:center; max-width:500px;">
        <h1 style="margin:0 0 24px; font-size:64px; letter-spacing:4px;">PERDISTE</h1>
        <p style="font-size:20px; margin:0 0 32px;">${message}</p>
        <button id="reiniciar-btn" style="cursor:pointer; font-size:22px; padding:14px 42px; background:#e74c3c; border:none; border-radius:8px; color:#fff; font-weight:600; box-shadow:0 4px 14px rgba(0,0,0,0.4);">Reiniciar</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      // Si se hizo click en el botón o en cualquier parte del overlay
      this.reiniciarJuego();
    });
    const btn = document.getElementById('reiniciar-btn');
    
    if (btn) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // evitar doble trigger
    this.reiniciarJuego();
  });
  }
  
}
  reiniciarJuego() {
    // Opción simple: recargar la página para resetear todos los estados
    window.location.reload();
  }

  onPlayerDestroyed() {
    // reutilizar pantalla de derrota con mensaje personalizado
    this.onBaseDestroyed('Moriste. Haz click para reiniciar.');
  }


 setupResizeHandler() {
  window.addEventListener("resize", () => {
    this.ancho = window.innerWidth;
    this.alto  = window.innerHeight;
    if (this.pixiApp) {
      this.pixiApp.renderer.resize(this.ancho, this.alto);
    }
    // antes: this.layoutUI?.();
    this.ui.layout(this.ancho, this.alto);
  });
}




}

