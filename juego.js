class Juego{
    pixiApp;
    protagonista;
    personajes = [];
    aliens = [];
    torretas = [];
    ancho;
    alto;
    keys = {};
    torretasTextures = {};
    obstaculos = [];
    muros = [];


    


    constructor(){
         this.updateDimensions();

        this.anchoDelMapa = 5000;
        this.altoDelMapa = 5000;

        this.mouse = {posicion: { x: 0, y: 0} };

        // Variables para el zoom
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom =  2;
        this.zoomStep = 0.1;

        this.setupKeyboard();
        this.initPixi();
        this.setupResizeHandler();
        
        
        
    }

     updateDimensions() {
    this.ancho = window.innerWidth;
    this.alto = window.innerHeight;
    
  }

  setupResizeHandler() {
    window.addEventListener("resize", () => {
      this.updateDimensions();
      if (this.pixiApp) {
        this.pixiApp.renderer.resize(this.ancho, this.alto);
      }
    });
  }


    //async indica q este metodo es asyncronico, es decir q puede usar "await"

    async initPixi(){
           //creo la aplicacion de pixi y la guardo en la propiedad pixiAp

        this.pixiApp = new PIXI.Application();

        this.pixiApp.stage.name = "al stage";

        const opcionesDePixi = {
            background : "#1099bb",
            width: this.ancho,
            height: this.alto,
        };

        //inicializo pixi con las opciones definidas anteriormente
        //await indica q el codigo se frena hasta que el metodo init de la app de pixi haya terminado
        await this.pixiApp.init(opcionesDePixi);


          //agregamos el elementos canvas creado por pixi en el documento html
        document.body.appendChild(this.pixiApp.canvas);
        this.pixiApp.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.pixiApp.stage.eventMode = 'static';
        this.pixiApp.stage.hitArea = this.pixiApp.screen;
        globalThis.__PIXI_APP__ = this.pixiApp;


        this.pixiApp.stage.sortableChildren = true;

         await this.crearNivel();
         await this.preloadTorretas();
         await this.preloadErizoCheco();
         await this.crearErizosRandom();
       
        
        
            console.log('Torretas cargadas:', Object.keys(this.torretasTextures));
            this.initUI();
            this.layoutUI();
            this.uiLayer.zIndex = 9999;
            this.pixiApp.stage.sortableChildren = true;
      
        

        

       const animacionesAlien = await PIXI.Assets.load("img/alienDef.json");

       const animacionesPersonaje = await PIXI.Assets.load("img/protagonista2.json");

       const texturaMuro = await PIXI.Assets.load("img/muro.png");

       this.crearProtagonista(animacionesPersonaje);

       this.targetCamara = this.protagonista;

      this.crearBunkerPerimetral(texturaMuro, { ladoTiles: 9 });

 
        

        //creamos 10 instancias de la clase cAlien

        for (let i = 0; i < 30; i++){
            const x = Math.random() * this.anchoDelMapa;
            const y = Math.random() * this.altoDelMapa;


         //crea una instancia de clase Alien, el constructor de dicha clase toma como parametros la textura
      // q queremos usar,X,Y y una referencia a la instancia del juego (this)
            const alien = new Alien(animacionesAlien,x,y,this);
           // alien.asignarVelocidad(Math.random() * 4 - 2, Math.random() * 4 - 2);
             alien.asignarTarget(this.protagonista); 
            this.personajes.push(alien);
            this.aliens.push(alien);


        }

         //agregamos el metodo this.gameLoop al ticker.
        //es decir: en cada frame vamos a ejecutar el metodo this.gameLoop

        this.pixiApp.ticker.add(this.gameloop.bind(this));
        this.agregarInteractividadDelMouse();
       
  
        //this.asignarPerseguidorRandomATodos();
        //this.asignarTargets();
       // this.asignarElMouseComoTargetATodosLosAliens();
    }

         async crearFondo(){
           this.fondo = new PIXI.TilingSprite(await PIXI.Assets.load("img/mapa_1_dis.png"));
        this.fondo.zIndex = -999999999999999999999;
        this.fondo.tileScale.set(0.5);
        this.fondo.width = this.anchoDelMapa;
        this.fondo.height = this.altoDelMapa;
        this.containerPrincipal.addChild(this.fondo);



        let vx = 0, vy = 0
        this.pixiApp.ticker.add(() => {
            this.fondo.tilePosition.x += vx;
            this.fondo.tilePosition.y += vy;
        });
        }


        async crearNivel(){
            this.containerPrincipal = new PIXI.Container();
            this.pixiApp.stage.addChild(this.containerPrincipal);
            await this.cargarTexturas();
            await this.crearFondo();
        }

         async cargarTexturas() {
            await PIXI.Assets.load("img/mapa_1_dis.png");
  }

    agregarInteractividadDelMouse(){
          // Escuchar el evento mousemove

          this.pixiApp.canvas.onmousemove = (event) =>{
            this.mouse.posicion = {x : event.x, y: event.y};
          };

          // Event listener para la rueda del mouse (zoom)
          this.pixiApp.canvas.addEventListener("wheel",(event) =>{
                event.preventDefault(); // Prevenir el scroll de la página

                const zoomDelta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;

                const nuevoZoom = Math.max(this.minZoom,Math.min(this.maxZoom,this.zoom + zoomDelta));

            
            if(nuevoZoom !== this.zoom){
             // Obtener la posición del mouse antes del zoom
             const mouseX = event.x;
             const mouseY = event.y;

             // Calcular el punto en coordenadas del mundo antes del zoom
            const worldPosX = (mouseX - this.containerPrincipal.x) / this.zoom;
             const worldPosY = (mouseY - this.containerPrincipal.y) / this.zoom;

            // Aplicar el nuevo zoom
            this.zoom = nuevoZoom;
            this.containerPrincipal.scale.set(this.zoom);

            // Ajustar la posición del contenedor para mantener el mouse en el mismo punto del mundo
             this.containerPrincipal.x = mouseX - worldPosX * this.zoom;
             this.containerPrincipal.y = mouseY - worldPosY * this.zoom;
          } 
          }); 
    }

    gameloop(time){
           const dt = this.pixiApp.ticker.deltaMS / 1000;
             //iteramos por todos los aliens
        for (let unPersonaje of this.personajes){
               //ejecutamos el metodo tick de cada alien
            unPersonaje.tick(dt);
            
            

        }

        for (const t of this.torretas) {
    t.update?.(dt);
  }

        this.hacerQLaCamaraSigaAlProtagonista();
    }

    getAlienRandom(){
        return this.aliens[Math.floor(this.aliens.length * Math.random())];
    }

    asignarTargets(){
        for(let unAlien of this.aliens){
            unAlien.asignarTarget(this.getAlienRandom());
        }
    }

    asignarElMouseComoTargetATodosLosAliens(){
        for(let unAlien of this.aliens){
            unAlien.asignarTarget(this.mouse);
        }
    }

    asignarPerseguidorRandomATodos(){
        for(let unAlien of this.aliens){
            unAlien.perseguidor = this.getAlienRandom();
        }
    }

    asignarElMouseComoPerseguidorATodosLosAliens(){
        for (let unAlien of this.aliens){
            unAlien.perseguidor = this.mouse;
        }
    }

    crearProtagonista(textureData){
         const x = this.anchoDelMapa / 2;
         const y = this.altoDelMapa / 2;
         const protagonista = new PersonajePPal(textureData,x, y, this);
         this.personajes.push(protagonista);
         this.protagonista = protagonista;
        this.targetCamara = protagonista;
    };

    //mov prota
    setupKeyboard(){

    window.addEventListener("keydown",(e) =>{
        this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup",(e)=>{
       delete this.keys[e.key.toLowerCase()];
    })

    };

    hacerQLaCamaraSigaAlProtagonista(){
        if(!this.protagonista) return;

        // objetivo (centra al prota con el zoom actual)
        let cx = -this.protagonista.posicion.x * this.zoom + this.ancho / 2;
        let cy = -this.protagonista.posicion.y * this.zoom + this.alto  / 2;

        // límites con zoom aplicado
        const minX = -(this.anchoDelMapa * this.zoom - this.ancho);
        const minY = -(this.altoDelMapa  * this.zoom - this.alto);

        // clamp para no mostrar fuera del mapa
         cx = Math.min(0, Math.max(minX, cx));
         cy = Math.min(0, Math.max(minY, cy));

        //  suavizado
        const lerp = 0.1;
        this.containerPrincipal.x += (cx - this.containerPrincipal.x) * lerp;
        this.containerPrincipal.y += (cy - this.containerPrincipal.y) * lerp;
        }



  // ===== UI =====
  PANEL_W = 220;
  PANEL_PAD = 16;
  ICON_SIZE = 64;

  initUI() {
    this.uiLayer = new PIXI.Container();
    this.pixiApp.stage.addChild(this.uiLayer);

    this.panel = new PIXI.Container();
    this.uiLayer.addChild(this.panel);

    this.panelBg = new PIXI.Graphics();
    this.panel.addChild(this.panelBg);

    this.panelTitle = new PIXI.Text({
      text: 'Torretas',
      style: { fill: 0xffffff, fontSize: 18, fontWeight: '600' }
    });
    this.panel.addChild(this.panelTitle);

    this.iconList = [];
    this.buildIcons();
  }

  layoutUI() {
    const w = this.ancho;
    const h = this.alto;

    this.panel.x = w - this.PANEL_W;
    this.panel.y = 0;

    this.panelBg.clear();
    this.panelBg.beginFill(0x121212);
    this.panelBg.drawRect(0, 0, this.PANEL_W, h);
    this.panelBg.endFill();
    this.panelBg.lineStyle(1, 0x2a2a2d);
    this.panelBg.moveTo(0, 0);
    this.panelBg.lineTo(0, h);

    this.panelTitle.x = this.PANEL_PAD;
    this.panelTitle.y = this.PANEL_PAD;

    this.layoutIcons();
  }

  buildIcons() {
    this.iconList = [
      this.makeTurretIcon('Torre básica', 'torreBasica'),
      this.makeTurretIcon('Torre splash', 'torreSplash'),
      this.makeTurretIcon('Torre lenta', 'torreLenta'),
    ];
    this.iconList.forEach(i => this.panel.addChild(i));
    this.layoutIcons();
  }

  layoutIcons() {
    let y = this.panelTitle.y + this.panelTitle.height + 10;
    for (const icon of this.iconList) {
      icon.x = this.PANEL_PAD;
      icon.y = y;
      y += this.ICON_SIZE + 28;
    }
  }

  makeTurretIcon(label, textureKey) {
    const c = new PIXI.Container();

    const g = new PIXI.Graphics();
    const bw = this.PANEL_W - this.PANEL_PAD * 2;
    const bh = this.ICON_SIZE + 20;
    g.beginFill(0x1f1f1f);
    g.drawRoundedRect(0, 0, bw, bh, 10);
    g.endFill();
    g.lineStyle(1, 0x2a2a2d).drawRoundedRect(0, 0, bw, bh, 10);
    c.addChild(g);

    const tex = this.torretasTextures[textureKey];
    const iconSprite = new PIXI.Sprite(tex);
    iconSprite.x = 12;
    iconSprite.y = 10;
    iconSprite.anchor.set(0, 0);
    const maxH = this.ICON_SIZE;
    const scale = maxH / iconSprite.height;
    iconSprite.scale.set(scale);
    c.addChild(iconSprite);

    const txt = new PIXI.Text({ text: label, style: { fill: 0xffffff, fontSize: 14 } });
    txt.x = iconSprite.x + iconSprite.width + 12;
    txt.y = (bh - txt.height) / 2;
    c.addChild(txt);

    c.eventMode = 'static';
    c.cursor = 'pointer';

    let dragging = false;
    let ghost = null;

    c.on('pointerdown', (e) => {
      dragging = true;

      const ghostSprite = new PIXI.Sprite(tex);
      ghostSprite.anchor.set(0.5);
      const desired = 40;
      const s = desired / Math.max(ghostSprite.width, ghostSprite.height);
      ghostSprite.scale.set(s);
      ghostSprite.alpha = 0.8;

      ghost = ghostSprite;
      this.pixiApp.stage.addChild(ghost);
      ghost.position.copyFrom(e.global);

      this.pixiApp.stage.on('pointermove', onPointerMove);
      this.pixiApp.stage.on('pointerup', onPointerUp);
      this.pixiApp.stage.on('pointerupoutside', onPointerUp);

   // aseguro que esté siempre visible sobre todo
  ghostSprite.zIndex = 99999;
  this.pixiApp.stage.sortableChildren = true;

  ghost = ghostSprite;
  this.pixiApp.stage.addChild(ghost);

  //  uso coordenadas correctas del canvas
  ghost.position.set(e.global.x, e.global.y);
  console.log("🟢 Ghost creado en:", e.global.x, e.global.y);

  this.pixiApp.stage.on('pointermove', onPointerMove);
  this.pixiApp.stage.on('pointerup', onPointerUp);
  this.pixiApp.stage.on('pointerupoutside', onPointerUp);

    });

    const onPointerMove = (e) => {
      if (!dragging || !ghost) return;
      ghost.position.copyFrom(e.global);
    };

   const onPointerUp = (e) => {
  this.pixiApp.stage.off('pointermove', onPointerMove);
  this.pixiApp.stage.off('pointerup', onPointerUp);
  this.pixiApp.stage.off('pointerupoutside', onPointerUp);

  if (!ghost) { dragging = false; return; }

  // Punto en coords de stage/pantalla
  const stagePt = e.global.clone();

  // ¿el mouse está sobre el panel UI?
  const b0 = this.panel.getBounds();
const rect = new PIXI.Rectangle(b0.x, b0.y, b0.width, b0.height);
const isOverPanel = rect.contains(stagePt.x, stagePt.y);
  if (isOverPanel) { /* no crear */ 
    ghost.destroy();               
    ghost = null;
    dragging = false;
    return; }

    const worldPt = this.containerPrincipal.toLocal(e.global);

    let t;
  try {
    t = new Torreta(this, worldPt.x, worldPt.y, textureKey);
  } catch (err) {
    console.error('Error creando torreta:', err);
    ghost.destroy(); ghost = null; dragging = false;
    return;
  }
  if (!t?.container) { // por si falló textura y algo raro
    console.error('Torreta creada sin container');
    ghost.destroy(); ghost = null; dragging = false;
    return;
  }
  this.containerPrincipal.addChild(t.container);
  t.container.zIndex = worldPt.y;
  this.containerPrincipal.sortableChildren = true;

  ghost.destroy();
  ghost = null;
  dragging = false;


};

    return c;
  }

 makePlacedTurret(textureKey) {
  const c = new PIXI.Container();

  // --- base/sombra
  const base = new PIXI.Graphics();
  base.beginFill(0x000000, 0.25).drawEllipse(0, 0, 22, 10).endFill();
  c.addChild(base);

  // --- sprite torreta
  const s = new PIXI.Sprite(this.torretasTextures[textureKey]);
  s.anchor.set(0.5, 0.85);
  const targetH = 40;
  s.scale.set(targetH / s.height);
  c.addChild(s);

  // --- cono de visión
  const cone = new PIXI.Graphics();
  c.addChildAt(cone, 0);

  // --- stats
  c.fovDeg = 80;
  c.fovRad = c.fovDeg * Math.PI / 180;
  c.halfFov = c.fovRad / 2;
  c.range = 300;
  c.range2 = c.range * c.range;
  c.cooldown = 0;
  c.fireRate = 2;          // disparos/seg
  c.turnSpeed = 6.0;       // rad/seg
  c.damage = 30;           // daño por disparo
  c.target = null;

  // si el sprite “mira hacia arriba”, compenso así:
  c.spriteFacingOffset = -Math.PI / 2;

  c.drawCone = () => {
    cone.clear();
    const start = -c.halfFov, end = c.halfFov;

    // relleno
    cone.beginFill(0x33ff55, 0.12);
    cone.moveTo(0, 0);
    cone.arc(0, 0, c.range, start, end);
    cone.lineTo(0, 0).endFill();

    // borde
    cone.lineStyle(2, 0x49ff6b, 0.7);
    cone.moveTo(0, 0);
    cone.arc(0, 0, c.range, start, end);

    // el cono apunta a donde mira la torreta
    cone.rotation = s.rotation + c.spriteFacingOffset;
  };

  // busca el mejor objetivo
  c.acquireTarget = () => {
    let best = null, bestD2 = Infinity;
    const x = c.position.x, y = c.position.y;

    for (const enemy of this.aliens) {
      if (!enemy?.vivo) continue;
      const ex = enemy.posicion.x, ey = enemy.posicion.y;

      const d2 = dist2(x, y, ex, ey);
      if (d2 > c.range2) continue;

      const angTo = anguloHacia(x, y, ex, ey);
      const facing = s.rotation + c.spriteFacingOffset;
      const diff = deltaAng(angTo, facing);
      if (diff > c.halfFov) continue;

      if (d2 < bestD2) { bestD2 = d2; best = enemy; }
    }
    c.target = best;
  };

  // el target sigue siendo válido?
  c.targetValid = () => {
    const t = c.target;
    if (!t || !t.vivo || !t.posicion || t.container?.destroyed) return false;

    const x = c.position.x, y = c.position.y;
    const ex = t.posicion.x, ey = t.posicion.y;
    if (dist2(x, y, ex, ey) > c.range2) return false;

    const angTo = anguloHacia(x, y, ex, ey);
    const facing = s.rotation + c.spriteFacingOffset;
    return deltaAng(angTo, facing) <= c.halfFov;
  };

  // rotación suave hacia un ángulo
  c.rotateTowards = (targetAngle, dt) => {
    let current = s.rotation + c.spriteFacingOffset;
    let diff = targetAngle - current;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const step = c.turnSpeed * dt;
    current = Math.abs(diff) <= step ? targetAngle : (current + Math.sign(diff) * step);
    s.rotation = current - c.spriteFacingOffset;
  };

  // disparo: dibuja láser y aplica daño
  c.shoot = (tx, ty) => {
    // láser visual
    const laser = new PIXI.Graphics();
    laser.lineStyle(3, 0xff5e5e, 0.9).moveTo(0, 0);
    const dstLocal = c.toLocal(new PIXI.Point(tx, ty), this.containerPrincipal);
    laser.lineTo(dstLocal.x, dstLocal.y);
    c.addChild(laser);

    let life = 0.08;
    laser.update = (dt) => {
      life -= dt;
      if (life <= 0) {
        c.removeChild(laser);
        if (laser.onTicker) this.pixiApp.ticker.remove(laser.onTicker);
      }
    };
    laser.onTicker = () => laser.update(this.pixiApp.ticker.deltaMS / 1000);
    this.pixiApp.ticker.add(laser.onTicker);

    // daño
    if (c.target?.recibirDaño && c.target.vivo) {
      c.target.recibirDaño(c.damage);
      if (!c.target.vivo) c.target = null; // liberar target si murió
    }
  };

  // update por frame
  c._targetRefresh = 0;
  c.update = (dt) => {
    c.cooldown = Math.max(0, c.cooldown - dt);

    c.sortableChildren = true;
    c.drawCone();

    if (!c.targetValid()) {
      c._targetRefresh -= dt;
      if (c._targetRefresh <= 0) {
        c.acquireTarget();
        c._targetRefresh = 0.15;
      }
    }

    if (c.target?.posicion) {
      const tx = c.target.posicion.x, ty = c.target.posicion.y;
      const want = anguloHacia(c.position.x, c.position.y, tx, ty); // <- sin "this"
      c.rotateTowards(want, dt);

      if (c.cooldown === 0 && c.targetValid()) {
        c.shoot(tx, ty);
        c.cooldown = 1 / c.fireRate;
      }
    }
  };

  // eliminar con botón derecho
  c.eventMode = 'static';
  c.cursor = 'crosshair';
  c.on('rightclick', () => {
    for (const child of [...c.children]) {
      if (child.onTicker) this.pixiApp.ticker.remove(child.onTicker);
    }
    c.destroy();
    this.torretas = this.torretas.filter(t => t !== c);
  });

  // registrar torreta
  //this.torretas.push(c);
  return c;
}

 async preloadTorretas() {
  
  const rutas = {
    torreBasica: 'img/turret_03b_mk3.png',
    torreSplash: 'img/turret_03_mk1.png',
    torreLenta:  'img/turret_02_mk1.png',
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
    torreLenta:  PIXI.Texture.from('torreLenta'),
  };

};

crearBunkerPerimetral(textureData, { ladoTiles = 9 } = {}) {
  const SCALE = Muro.SCALE;

  // medir longitudes reales
  const h = new PIXI.Sprite(textureData); h.anchor.set(0.5); h.scale.set(SCALE);
  const lenH = h.width;   // largo útil de un muro horizontal
  const thickH = h.height; // grosor (alto) del horizontal
  h.destroy();

  const v = new PIXI.Sprite(textureData); v.anchor.set(0.5); v.scale.set(SCALE); v.rotation = Math.PI/2;
  const lenV = v.height;   // largo útil de un muro vertical
  const thickV = v.width;  // grosor (ancho) del vertical
  v.destroy();

  // solapamiento general
  const overlapX = 10;
  const overlapY = 10;

  const stepX = lenH - overlapX;
  const stepY = lenV - overlapY;

  // cuánto metemos las puntas para que no “se pasen”
  const cornerInsetX = Math.max(0, thickV/2 - overlapX/2); // para extremos de filas (afecta X)
  const cornerInsetY = Math.max(0, thickH/2 - overlapY/2); // para extremos de columnas (afecta Y)

  const cx = this.protagonista.posicion.x;
  const cy = this.protagonista.posicion.y;

  const n = ladoTiles;
  const halfSpanX = ((n - 1) / 2) * stepX;
  const halfSpanY = ((n - 1) / 2) * stepY;

  const leftX   = cx - halfSpanX;
  const rightX  = cx + halfSpanX;
  const topY    = cy - halfSpanY;
  const bottomY = cy + halfSpanY;

  // === columnas (izquierda/derecha) ===
  for (let k = 0; k < n; k++) {
    // y base de cada bloque en la columna
    let y = topY + k * stepY;

    // extremos: meter un poco hacia adentro para encajar con la fila
    let yL = y, yR = y;
    if (k === 0)        { yL += cornerInsetY; yR += cornerInsetY; }     // arriba
    else if (k === n-1) { yL -= cornerInsetY; yR -= cornerInsetY; }     // abajo

    for (const [x,yAdj] of [[leftX, yL],[rightX, yR]]) {
      const m = new Muro(textureData, x, yAdj, this);
      this.personajes.push(m);
      m.sprite.anchor.set(0.5);
      m.sprite.scale.set(SCALE);
      m.sprite.rotation = Math.PI/2;
      m.sprite.position.set(x, yAdj);
      m.sprite.zIndex = yAdj;
    }
  }

  // === filas (superior/inferior) ===
  for (let k = 0; k < n; k++) {
    let x = leftX + k * stepX;

    // extremos: meter un poco hacia adentro para encajar con la columna
    let xT = x, xB = x;
    if (k === 0)        { xT += cornerInsetX; xB += cornerInsetX; }     // izquierda
    else if (k === n-1) { xT -= cornerInsetX; xB -= cornerInsetX; }     // derecha

    for (const [y,xAdj] of [[topY, xT],[bottomY, xB]]) {
      const m = new Muro(textureData, xAdj, y, this);
      this.personajes.push(m);
      m.sprite.anchor.set(0.5);
      m.sprite.scale.set(SCALE);
      m.sprite.rotation = 0;
      m.sprite.position.set(xAdj, y);
      m.sprite.zIndex = y;
    }
  }

  this.containerPrincipal.sortableChildren = true;
}

crearErizosRandom(){
  for(let i = 0; i < 100; i++){
    const erizo = new ErizoCheco(
      Math.random() * this.anchoDelMapa,
      Math.random() * this.altoDelMapa,
      this,
      0.05
    );
    this.obstaculos.push(erizo)
  }
}


crearErizoEnElCentro() {
  const { x, y } = this.protagonista.posicion;
  const e = new ErizoCheco(x + 60, y, this, 0.1);
  this.obstaculos.push(e);

  // marcador visual (cruz)
  const g = new PIXI.Graphics();
  g.lineStyle(3, 0xff00ff, 1);
  g.moveTo(-12, 0).lineTo(12, 0);
  g.moveTo(0, -12).lineTo(0, 12);
  e.container.addChild(g);

  e.container.zIndex = y;                    // profundidad por Y
  this.containerPrincipal.sortableChildren = true;
}
async preloadErizoCheco() {
  PIXI.Assets.add({ alias: 'erizoCheco', src: 'img/erizo checo.png' });
  await PIXI.Assets.load('erizoCheco');
}

hayColisionEntreMuroYAlien(alienX, alienY, alienRadio){
  // === convertir posición del alien (mundo) a GLOBAL
  const pGlobal = this.containerPrincipal.toGlobal(new PIXI.Point(alienX, alienY));

  // === el radio debe escalarse igual que el mundo (zoom actual)
  const escala = this.containerPrincipal.scale.x; // 
  const alienRadioGlobal = alienRadio * escala;
  const alienRadioGlobal2 = alienRadioGlobal * alienRadioGlobal;

  for (const muro of this.muros){
    // Bounds del muro ya están en GLOBAL
    const cajaMuro = muro.cajaAlineadaAEjesMuro();

    // Punto más cercano de la AABB al punto del alien (todo en GLOBAL)
    const puntoXMuroMasCercanoAlien = Math.max(cajaMuro.x, Math.min(pGlobal.x, cajaMuro.x + cajaMuro.width));
    const puntoYMuroMasCercanoAlien = Math.max(cajaMuro.y, Math.min(pGlobal.y, cajaMuro.y + cajaMuro.height));

    const diferenciaEnX = pGlobal.x - puntoXMuroMasCercanoAlien;
    const diferenciaEnY = pGlobal.y - puntoYMuroMasCercanoAlien;

    const distanciaCuad = diferenciaEnX * diferenciaEnX + diferenciaEnY * diferenciaEnY;

    if (distanciaCuad <= alienRadioGlobal2){
      // Volvemos el punto de contacto a coords del MUNDO (containerPrincipal)
      const puntoContactoMundo = this.containerPrincipal.toLocal(
        new PIXI.Point(puntoXMuroMasCercanoAlien, puntoYMuroMasCercanoAlien)
      );

      return {
        hayColision: true,
        muro: muro,
        puntoContacto: {
          x: puntoContactoMundo.x,
          y: puntoContactoMundo.y,
        }
      };
    }
  }
  return false;
}

buscarTorretaCercana(pos) {
  let minD2 = Infinity, objetivo = null;
  for (const t of this.torretas) {
    if (!t?.vivo) continue;
    const tp = t.container?.position ?? t.posicion;   // soporta ambas
    const d2 = dist2(pos.x, pos.y, tp.x, tp.y);
    if (d2 < minD2) { minD2 = d2; objetivo = t; }
  }
  return objetivo;
}
}
