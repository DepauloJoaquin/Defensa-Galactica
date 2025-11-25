class UIManager {
  constructor(app, juego, mundo, waveManager, torretasTextures) {
    this.app = app;
    this.juego = juego;
    this.mundo = mundo;
    this.waveManager = waveManager;
    this.torretasTextures = torretasTextures;

    this._fpsTimer = 0;
    this.fpsText = null;




    // Constantes de layout
    this.PANEL_W = 220;
    this.PANEL_PAD = 16;
    this.ICON_SIZE = 64;


    // Estado de torretas (costes)
    this.turretCosts = {
      torreLenta: 10,
      torreSplash: 15,
      torreBasica: 20,
    };
  }

   init(ancho, alto) {
    this.ancho = ancho;
    this.alto  = alto;


    
    // Capa UI
    this.uiLayer = new PIXI.Container();
    this.app.stage.addChild(this.uiLayer);

    
    // Panel lateral
    this.panel = new PIXI.Container();
    this.uiLayer.addChild(this.panel);

    this.panelBg = new PIXI.Graphics();
    this.panel.addChild(this.panelBg);

    this.panelTitle = new PIXI.Text({
      text: 'Torretas',
      style: { fill: 0xffffff, fontSize: 18, fontWeight: '600' }
    });
    this.panel.addChild(this.panelTitle);

     // Iconos de torretas
    this.iconList = [];
    this.buildIcons();


      // HUD textos
    this.scoreText = new PIXI.Text('Puntaje: 0', {
      fill: 0xffffff, fontSize: 24, fontWeight: '800'
    });
    this.waveText = new PIXI.Text('Oleada: 0', {
      fill: 0xffffff, fontSize: 16, fontWeight: '700'
    });
    this.uiLayer.addChild(this.scoreText, this.waveText);

    this.metalText = new PIXI.Text('Metal: 0', {
      fill: 0xc0c0c0, fontSize: 16, fontWeight: '700'
    });
    this.uiLayer.addChild(this.metalText);


     // --- FPS ---
   this.fpsText = new PIXI.Text('FPS: --', {
     fill: 0x00ff00,
     fontSize: 14,
     fontWeight: '600'
   });
   this.uiLayer.addChild(this.fpsText);


    // Barra de vida del jugador
    this.playerHealthBar = new PIXI.Graphics();
    this.uiLayer.addChild(this.playerHealthBar);


    // Toast HTML
    this.toastLayer = document.createElement('div');
    Object.assign(this.toastLayer.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none',
    });
    document.body.appendChild(this.toastLayer);

    this.layout(this.ancho, this.alto);
  }

  
  // llamado desde Juego._onTick
  update(dt) {
    this.actualizarHUD();
    this.dibujarBarraVidaJugador();
    this.actualizarFPS(dt);
  }


   layout(ancho, alto) {
    this.ancho = ancho;
    this.alto  = alto;

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

    // HUD esquina superior izquierda
    if (this.scoreText) {
      this.scoreText.x = 12;
      this.scoreText.y = 12;
      this.scoreText.zIndex = 99999;
    }
    if (this.waveText) {
      const gap = 8;
      this.waveText.x = 12;
      this.waveText.y = this.scoreText.y + this.scoreText.height + gap;
      this.waveText.zIndex = 99999;
    }
    if (this.metalText) {
      const gap2 = 6;
      this.metalText.x = 12;
      this.metalText.y = this.waveText.y + this.waveText.height + gap2;
      this.metalText.zIndex = 99999;
    }


     if (this.fpsText) {
     // esquina superior derecha, pegado al panel
     this.fpsText.x = this.panel.x - this.fpsText.width - 12;
     this.fpsText.y = 12;
     this.fpsText.zIndex = 99999;
   }
    if (this.playerHealthBar) {
      this.playerHealthBar.zIndex = 100000;
    }
  }


  // === HUD numérico ===
   actualizarHUD() {
    if (this.scoreText) {
      this.scoreText.text = `Puntaje: ${this.juego.score}`;
    }
    if (this.waveText && this.waveManager) {
      this.waveText.text = `Oleada: ${this.waveManager.waveId + 1}`;
    }
    if (this.metalText) {
      this.metalText.text = `Metal: ${this.juego.metal}`;
    }
    this.actualizarEstadoCostesUI();
  }



  // === Barra de vida jugador ===
  dibujarBarraVidaJugador() {
    const protagonista = this.mundo.protagonista;
    if (!protagonista || !this.playerHealthBar) return;
    const g = this.playerHealthBar;
    g.clear();

    const vidaActual = Math.max(0, protagonista.vida);
    const vidaMax = protagonista.vidaMaxima || vidaActual || 1;
    const ratio = vidaActual / vidaMax;

    const ancho = 200;
    const alto = 20;
    const GAP_PANEL = 24;
    const TOP_GAP = 24;

    let panelX;

// Si existe this.panel y tiene una x numérica, usamos esa
if (this.panel && typeof this.panel.x === 'number') {
  panelX = this.panel.x;
} else {
  // Si no, usamos el valor por defecto (ancho de la pantalla - ancho del panel)
  panelX = this.ancho - this.PANEL_W;
}

// Luego calculamos x final
const x = panelX - ancho - GAP_PANEL;
    const y = TOP_GAP;

    g.beginFill(0x222222, 0.85);
    g.drawRoundedRect(x, y, ancho, alto, 8);
    g.endFill();

   let _colorVida;

if (ratio > 0.6) {
  _colorVida = 0x27ae60;
} else if (ratio > 0.3) {
  _colorVida = 0xf1c40f;
} else {
  _colorVida = 0xe74c3c;
}

const colorVida = _colorVida;
    g.beginFill(colorVida, 0.95);
    g.drawRoundedRect(x + 3, y + 3, (ancho - 6) * ratio, alto - 6, 6);
    g.endFill();

    if (!this._playerHpText) {
      this._playerHpText = new PIXI.Text({
        text: '',
        style: { fill: 0xffffff, fontSize: 18, fontWeight: '600' }
      });
      this.uiLayer.addChild(this._playerHpText);
      this._playerHpText.zIndex = 100001;
    }

    const vidaInt = Math.floor(vidaActual);
    const vidaMaxInt = Math.floor(vidaMax);
    this._playerHpText.text = `HP ${vidaInt}/${vidaMaxInt}`;
    this._playerHpText.x = x + 4;
    this._playerHpText.y = y - (this._playerHpText.height + 4);
  }


   // === Toasts ===
  mostrarToast(mensaje, { tiempo = 1600 } = {}) {
    const div = document.createElement('div');
    Object.assign(div.style, {
      background: 'rgba(30,30,30,0.9)',
      color: '#fff',
      padding: '10px 18px',
      borderRadius: '8px',
      fontFamily: 'Arial',
      fontSize: '14px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
      opacity: '0',
      transition: 'opacity 0.3s'
    });
    div.textContent = mensaje;
    this.toastLayer.appendChild(div);
    requestAnimationFrame(() => div.style.opacity = '1');
    setTimeout(() => {
      div.style.opacity = '0';
      setTimeout(() => div.remove(), 350);
    }, tiempo);
  }


   // === Panel de torretas ===
  buildIcons() {
    this.iconList = [
      this.makeTurretIcon('Torre básica', 'torreBasica'),
      this.makeTurretIcon('Torre splash', 'torreSplash'),
      this.makeTurretIcon('Torre lenta', 'torreLenta'),
    ];
    this.iconList.forEach(i => this.panel.addChild(i));
    this.layoutIcons();
    this.actualizarEstadoCostesUI();
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
    const c = new PIXI.Container(); // contenedor principal del icono
    c.textureKey = textureKey;  // guardamos la key de la torreta en el propio contenedor


      // Aseguramos que el objeto de costes exista
  if (!this.turretCosts) {
    this.turretCosts = {};
  }


   // ---- funciones auxiliares simples ----
  // Obtiene el coste actual de la torreta

    function getTurretCost(turretCosts, key) {
    if (!turretCosts || turretCosts[key] == null) return 0;
    return turretCosts[key];
  }


   // Aumenta el coste de la torreta en +5
  function increaseTurretCost(turretCosts, key) {
    const actual = getTurretCost(turretCosts, key);
    turretCosts[key] = actual + 5;
  }

  
  // =========================
  // 1) FONDO DEL ICONO
  // =========================


    const g = new PIXI.Graphics();
    const bw = this.PANEL_W - this.PANEL_PAD * 2; // ancho del bloque
    const bh = this.ICON_SIZE + 38;// alto del bloque
   
    // Fondo oscuro con borde redondeado
    g.beginFill(0x1f1f1f);
    g.drawRoundedRect(0, 0, bw, bh, 10);
    g.endFill();

     // Borde
    g.lineStyle(1, 0x2a2a2d)
    g.drawRoundedRect(0, 0, bw, bh, 10);

    c.addChild(g);


     // =========================
  // 2) ICONO DE LA TORRETA
  // =========================

    const tex = this.torretasTextures[textureKey];  // textura de la torreta
    const iconSprite = new PIXI.Sprite(tex);
    iconSprite.x = 12;
    iconSprite.y = 10;
    iconSprite.anchor.set(0, 0);

    // Escalar el sprite para que encaje en ICON_SIZE de alto
    const maxH = this.ICON_SIZE;
    const scale = maxH / iconSprite.height;
    iconSprite.scale.set(scale);

    c.addChild(iconSprite);


    
  // =========================
  // 3) TEXTO DE NOMBRE (label)
  // =========================

    const txt = new PIXI.Text({
      text: `${label}`,
      style: { fill: 0xffffff, fontSize: 14 }
    });
     // Lo colocamos a la derecha del icono
    txt.x = iconSprite.x + iconSprite.width + 12;
    txt.y = 10;
    c.addChild(txt);

    // =========================
  // 4) TEXTO DE PRECIO
  // =========================
     const costeInicial = getTurretCost(this.turretCosts, textureKey);

    const priceText = new PIXI.Text({
      text: `${costeInicial} metal`,
      style: { fill: 0xc0c0c0, fontSize: 13, fontWeight: '600' }
    });
    // Centrado debajo del icono
    priceText.y = iconSprite.y + iconSprite.height + 4;
    priceText.x = iconSprite.x + iconSprite.width / 2 - priceText.width / 2;
    c.addChild(priceText);

     // Guardamos referencias útiles en el contenedor
    c.priceText = priceText;
    c.iconSprite = iconSprite;

    // =========================
  // 5) CONFIGURAR INTERACCIÓN (drag & drop)
  // =========================

    c.eventMode = 'static';
    c.cursor = 'pointer';

    let dragging = false; // indica si estamos arrastrando
    let ghost = null;      // sprite “fantasma” que se mueve con el ratón

    c.on('pointerdown', (e) => {
        // 5.1) Comprobar si el jugador puede pagar la torreta
       const costeNecesario = getTurretCost(this.turretCosts, textureKey);
      if (!this.juego.puedePagar(costeNecesario)) {
        this.mostrarToast(
          `Necesitas ${costeNecesario} metal (tienes ${this.juego.metal || 0})`
        );
        return;
      }
        // 5.2) Activar modo arrastre
      dragging = true;

      // Crear sprite fantasma que sigue el puntero
      const ghostSprite = new PIXI.Sprite(tex);
      ghostSprite.anchor.set(0.5);

      // Escala el fantasma a un tamaño cómodo (40px máx)

      const desired = 40;
      const s = desired / Math.max(ghostSprite.width, ghostSprite.height);
      ghostSprite.scale.set(s);
      ghostSprite.alpha = 0.8;

      ghost = ghostSprite;
      this.app.stage.addChild(ghost);
      ghost.position.copyFrom(e.global);
      ghost.zIndex = 99999;
      this.app.stage.sortableChildren = true;

        // 5.3) Función que mueve el fantasma mientras arrastramos
      const onPointerMove = (e2) => {
        if (!dragging || !ghost) return;
        ghost.position.copyFrom(e2.global);
      };
       // 5.4) Al soltar el click: intentar colocar la torreta
      const onPointerUp = (e2) => {
         // Quitamos los listeners (ya no arrastramos)
        this.app.stage.off('pointermove', onPointerMove);
        this.app.stage.off('pointerup', onPointerUp);
        this.app.stage.off('pointerupoutside', onPointerUp);

        if (!ghost) { dragging = false; return; }

         // 5.4.1) Si se suelta encima del panel, cancelar y destruir fantasma
        const stagePt = e2.global.clone();
        const b0 = this.panel.getBounds();
        const rect = new PIXI.Rectangle(b0.x, b0.y, b0.width, b0.height);
        const isOverPanel = rect.contains(stagePt.x, stagePt.y);
        if (isOverPanel) {
          ghost.destroy();
          ghost = null;
          dragging = false;
          return;
        }
        // 5.4.2) Convertir posición del puntero a coordenadas del mundo

        const worldPt = this.mundo.container.toLocal(e2.global);

         // 5.4.3) Cobrar el coste de la torreta
         const costeColocar = getTurretCost(this.turretCosts, textureKey);
        if (!this.juego.pagar(costeColocar)) {
        this.mostrarToast('No tienes suficiente metal.');
        ghost.destroy();
        ghost = null;
        dragging = false;
        return;
      }
       // 5.4.4) Crear la torreta en el mundo

        let t;
        try {
          t = new Torreta(this.mundo, worldPt.x, worldPt.y, textureKey);

           // Aumentar el coste para la próxima vez
          increaseTurretCost(this.turretCosts, textureKey);
           // Contador de torretas colocadas
           this.juego.torretasColocadasTotal =
          (this.juego.torretasColocadasTotal || 0) + 1;

           // Actualizar UI de costes (incluye actualizar priceText)
          this.actualizarEstadoCostesUI();
        } catch (err) {
          console.error('Error creando torreta:', err);
          ghost.destroy(); ghost = null; dragging = false;
          return;
        }
        

        // Comprobar que la torreta tiene container válido
         if (!t || !t.container) {
        console.error('Torreta creada sin container');
        ghost.destroy();
        ghost = null;
        dragging = false;
        return;
      }



        // 5.4.5) Añadir la torreta al mundo
        this.mundo.container.addChild(t.container);
        t.container.zIndex = worldPt.y;
        this.mundo.container.sortableChildren = true;

         // 5.4.6) Eliminar fantasma y salir de modo arrastre
        ghost.destroy();
        ghost = null;
        dragging = false;
      };

       // Registrar listeners mientras estamos arrastrando
      this.app.stage.on('pointermove', onPointerMove);
      this.app.stage.on('pointerup', onPointerUp);
      this.app.stage.on('pointerupoutside', onPointerUp);
    });

    return c;
  }

  actualizarEstadoCostesUI() {
     // Aseguramos que exista el objeto de costes
     if (!this.turretCosts) {
    this.turretCosts = {};
  }


     // Recorremos todos los iconos de torretas del panel
    for (const icon of this.iconList) {
    let labelNode = null; // texto del nombre de la torreta
    let spr = null;       // sprite del icono de la torreta

      // Buscar dentro de los hijos del icono:
    //  - un PIXI.Text que NO sea el priceText  => nombre
    //  - un PIXI.Sprite => icono de la torreta
    for (const ch of icon.children) {
      if (!labelNode && ch instanceof PIXI.Text && ch !== icon.priceText) {
        labelNode = ch;
      }
      if (!spr && ch instanceof PIXI.Sprite) {
        spr = ch;
      }
      if (labelNode && spr) {
        break; // ya tenemos ambos, salimos del bucle
      }
    }

    // Si por alguna razón falta el texto o el sprite, pasamos al siguiente icono
    if (!labelNode || !spr) {
      continue;
    }

    const key = icon.textureKey;

  // Obtener el coste de esa torreta (0 si no está definido)
    let coste = 0;
    if (this.turretCosts[key] != null) {
      coste = this.turretCosts[key];
    }

    // Comprobar si el jugador puede pagar ese coste
    const puede = this.juego.puedePagar(coste);

    // Cambiar color del icono y del texto según si puede pagar o no
    if (puede) {
      spr.tint = 0xffffff;          // icono brillante
      labelNode.style.fill = 0xffffff; // texto claro
    } else {
      spr.tint = 0x555555;          // icono grisáceo
      labelNode.style.fill = 0xaaaaaa; // texto algo apagado
    }

    // Actualizar el texto y posición del precio si existen las referencias
    if (icon.priceText && icon.iconSprite) {
      icon.priceText.text = coste + ' metal';

      // Centrar el texto de precio debajo del icono
      icon.priceText.x =
        icon.iconSprite.x +
        icon.iconSprite.width / 2 -
        icon.priceText.width / 2;
    }
  }
  }

   actualizarFPS(dt) {
    if (!this.fpsText) return;

    // actualizo el texto solo cada ~0.25s para que no parpadee
    this._fpsTimer += dt;
    if (this._fpsTimer < 0.25) return;
    this._fpsTimer = 0;

    // Pixi tiene el FPS en el ticker
    const fps = this.app.ticker.FPS || (1000 / this.app.ticker.deltaMS);
    this.fpsText.text = `FPS: ${fps.toFixed(0)}`;
  }


}