class Torreta {
  constructor(juego, x, y, texturaId) {
    this.juego = juego;
    this.vivo = true;
    this.vida = 120;

    // Asumimos que casi siempre hay textura; si no, fallback rápido con ||
    const textura = (juego.torretasTextures && juego.torretasTextures[texturaId]) || PIXI.Texture.WHITE;

    this.container = new PIXI.Container();
    this.container.position.set(x, y);
    this.container.sortableChildren = true;

    const sombra = new PIXI.Graphics();
    sombra.beginFill(0x000000, 0.25).drawEllipse(0, 0, 22, 10).endFill();
    this.container.addChild(sombra);

    this.sprite = new PIXI.Sprite(textura);
    this.sprite.anchor.set(0.5, 0.85);
    this.sprite.scale.set(40 / this.sprite.height);
    this.container.addChild(this.sprite);

    this.conoVision = new PIXI.Graphics();
    this.container.addChildAt(this.conoVision, 0);

    this.anguloVision = 80 * Math.PI / 180;
    this.mitadVision = this.anguloVision / 2;
    this.alcance = 300;
    this.alcance2 = this.alcance * this.alcance;
    this.velocidadGiro = 6;
    this.ataquesPorSegundo = 2;
    this.enfriamiento = 0;
    this.daño = 30;
    this.rotacionBase = -Math.PI / 2;
    this.objetivo = null;
    this.tiempoBuscar = 0;

    this.container.eventMode = 'static';
    this.container.cursor = 'crosshair';
    this.container.on('rightclick', () => this.destruir());

    juego.torretas.push(this);
  }

  update(dt) {
    if (!this.vivo) return;

    this.enfriamiento = Math.max(0, this.enfriamiento - dt);
    this.dibujarCono();

    // Buscar objetivo si no hay o ya no es válido (validación rápida)
    if (!this.objetivo || !this.objetivo.vivo || !this.objetivo.posicion || !this.objetivoValido()) {
      this.tiempoBuscar -= dt;
      if (this.tiempoBuscar <= 0) {
        this.buscarObjetivo();
        this.tiempoBuscar = 0.15;
      }
    }

    if (this.objetivo) {
      const { x: ox, y: oy } = this.objetivo.posicion;
      const anguloDeseado = anguloHacia(this.container.x, this.container.y, ox, oy);

      this.girarHacia(anguloDeseado, dt);

      if (this.enfriamiento === 0 && this.objetivoValido()) {
        this.disparar(ox, oy);
        this.enfriamiento = 1 / this.ataquesPorSegundo;
      }
    }

    this.container.zIndex = this.container.y;
  }

  dibujarCono() {
    const c = this.conoVision;
    c.clear();

    c.beginFill(0x33ff55, 0.12);
    c.moveTo(0, 0);
    c.arc(0, 0, this.alcance, -this.mitadVision, this.mitadVision);
    c.lineTo(0, 0).endFill();

    c.lineStyle(2, 0x49ff6b, 0.7);
    c.moveTo(0, 0);
    c.arc(0, 0, this.alcance, -this.mitadVision, this.mitadVision);

    c.rotation = this.sprite.rotation + this.rotacionBase;
  }

  buscarObjetivo() {
    let mejor = null;
    let menorDistancia = Infinity;
    const { x, y } = this.container.position;

    // Asumimos aliens con forma consistente; solo saltamos si !vivo
    for (const enemigo of this.juego.aliens) {
      if (!enemigo.vivo) continue;

      const { x: ex, y: ey } = enemigo.posicion;
      const d2 = dist2(x, y, ex, ey);
      if (d2 > this.alcance2) continue;

      const angulo = anguloHacia(x, y, ex, ey);
      const mirando = this.sprite.rotation + this.rotacionBase;
      const dif = deltaAng(angulo, mirando);
      if (dif > this.mitadVision) continue;

      if (d2 < menorDistancia) {
        menorDistancia = d2;
        mejor = enemigo;
      }
    }

    this.objetivo = mejor;
  }

  objetivoValido() {
    // Asumimos this.objetivo no nulo para llamar a esta función,
    // pero igual confirmamos lo mínimo.
    const o = this.objetivo;
    if (!o || !o.vivo) return false;

    const { x, y } = this.container.position;
    const { x: ox, y: oy } = o.posicion;

    if (dist2(x, y, ox, oy) > this.alcance2) return false;

    const angulo = anguloHacia(x, y, ox, oy);
    const mirando = this.sprite.rotation + this.rotacionBase;
    return deltaAng(angulo, mirando) <= this.mitadVision;
  }

  girarHacia(anguloObjetivo, dt) {
    let actual = this.sprite.rotation + this.rotacionBase;
    let dif = anguloObjetivo - actual;

    while (dif > Math.PI) dif -= Math.PI * 2;
    while (dif < -Math.PI) dif += Math.PI * 2;

    const paso = this.velocidadGiro * dt;
    actual = Math.abs(dif) <= paso ? anguloObjetivo : actual + Math.sign(dif) * paso;
    this.sprite.rotation = actual - this.rotacionBase;
  }

  disparar(xObjetivo, yObjetivo) {
    const laser = new PIXI.Graphics();
    laser.lineStyle(3, 0xff5e5e, 0.9).moveTo(0, 0);

    const destinoLocal = this.container.toLocal(
      new PIXI.Point(xObjetivo, yObjetivo),
      this.juego.containerPrincipal
    );
    laser.lineTo(destinoLocal.x, destinoLocal.y);
    this.container.addChild(laser);

    let vida = 0.08;
    laser.update = (dt) => {
      vida -= dt;
      if (vida <= 0) {
        this.container.removeChild(laser);
        if (laser.onTicker) this.juego.pixiApp.ticker.remove(laser.onTicker);
      }
    };
    laser.onTicker = () => laser.update(this.juego.pixiApp.ticker.deltaMS / 1000);
    this.juego.pixiApp.ticker.add(laser.onTicker);

    // Asumimos objetivo válido; chequeo mínimo
    if (this.objetivo && this.objetivo.vivo) {
      this.objetivo.recibirDaño?.(this.daño);
      if (!this.objetivo.vivo) this.objetivo = null;
    }
  }

  recibirDaño(cantidad) {
    if (!this.vivo) return;
    this.vida -= cantidad;
    this.sprite.tint = 0xff6666;
    setTimeout(() => (this.sprite.tint = 0xffffff), 80);
    if (this.vida <= 0) this.destruir();
  }

  destruir() {
    if (!this.vivo) return;
    this.vivo = false;

    for (const hijo of [...this.container.children]) {
      if (hijo.onTicker) this.juego.pixiApp.ticker.remove(hijo.onTicker);
    }

    this.container.destroy();
    this.juego.torretas = this.juego.torretas.filter(t => t !== this);
  }
}
