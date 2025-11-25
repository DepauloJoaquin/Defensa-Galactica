class WaveManager {
  constructor(mundo, configOleadas, animacionesAlien, juego) {
    this.mundo = mundo;
    this.config = configOleadas;      // GAME_CONFIG.oleadas
    this.animacionesAlien = animacionesAlien;
    this.juego = juego;

    this.waveId = 0;                  // índice/ID de oleada actual
    this.enWave = false;
    this.tiempoHastaSiguienteWave = 0;

    this.aliensRestantesPorSpawnear = 0;
    this.spawnInterval = 0;
    this._spawnTimer = 0;
  }

    empezarPrimeraWave() {
    this.waveId = 0;
    this._prepararWave(this.waveId);
  }


  
  _cantidadAliensParaWave(waveIndex) {
    const base   = this.config.baseSize;
    const growth = this.config.growth;
    // waveIndex = 0 → base
    // waveIndex = 1 → base + growth
    return base +  growth * waveIndex;
  }

   _prepararWave() {
    const cantidad = this._cantidadAliensParaWave(this.waveId);

    this.enWave = true;
    this.aliensRestantesPorSpawnear = cantidad;
    this.spawnInterval = this.config.spawnInterval;
    this._spawnTimer = 0;

    console.log(`▶ Wave ${this.waveId + 1} → ${cantidad} aliens`);
  }

    update(dt) {
    // Si no estamos en una wave, contamos para la siguiente
    if (!this.enWave) {
      this.tiempoHastaSiguienteWave -= dt;
      // Auto-start de la wave 0
      if (this.tiempoHastaSiguienteWave <= 0) {
        this._prepararWave();
      }
      return;
    }

    // --- Spawns ---
    if (this.aliensRestantesPorSpawnear > 0) {
      this._spawnTimer -= dt;
      if (this._spawnTimer <= 0) {
        this._spawnAlien();
        this.aliensRestantesPorSpawnear--;
        this._spawnTimer = this.spawnInterval;
      }
    }

    // --- Fin de wave ---
    if (this.aliensRestantesPorSpawnear <= 0 && this._noQuedanAliensVivos()) {
      this.enWave = false;
      console.log(`✓ Wave ${this.waveId + 1} completada`);

      // avanzar a la siguiente
      this.waveId++;

      // Delay fijo/escalado antes de la próxima
      const baseDelay = 3;
      const extra = 0.5 * this.waveId;  // cada vez un poquito más
      this.tiempoHastaSiguienteWave = baseDelay + extra;

      // Si querés recompensa por wave:
      // this.juego.sumarMetal(2 + this.waveId);
    }
  }

    _spawnAlien() {
    const spread   = this.config.horizontalSpread;
    const oleadaIx = this.waveId;
    const baseObj  = this.mundo.base;
     const basePos  = baseObj.posicion;

    // Centro de spawn cerca de la base (arriba del mapa)
    const mapaCentroX = this.mundo.anchoDelMapa / 2;
     
    let baseX;
      if (basePos) {
       baseX = basePos.x;
} else {
  baseX = mapaCentroX;
}
    let x = baseX + (Math.random() * 2 - 1) * spread;
    x = Math.max(50, Math.min(this.mundo.anchoDelMapa - 50, x));
    const y = 50; // borde superior

    const alien = new Alien(this.animacionesAlien, x, y, this.mundo, 'basico');


    if (baseObj && baseObj.posicion) {
    alien._approachBase = true;
    // Un poco por encima de la base para que choquen con el bunker
    alien._baseTarget = {
      x: baseObj.posicion.x,
      y: baseObj.posicion.y
    };
  
  }

    // -------- Escalado por oleada --------
    const extraVida = (this.config.vidaExtraPorOleada) * oleadaIx;

   
      alien.vidaMaxima += extraVida;
      alien.vida = alien.vidaMaxima;
    

    // Si tu Alien tiene alguna propiedad de daño base, la podés subir así:
    // const extraDaño = (this.config.dañoExtraPorOleada ?? 0) * oleadaIx;
    // if (typeof alien.dañoBase === 'number') {
    //   alien.dañoBase += extraDaño;
    // }

    // -------- Bonus según cantidad de torretas --------
    const totalTorretas = this.juego.torretasColocadasTotal || 0;
    let velFactor = 1;

    if (totalTorretas < 4) {
      velFactor = this.config.velBonusPorTorre.lenta;
    } else if (totalTorretas < 8) {
      velFactor = this.config.velBonusPorTorre.media;
    } else {
      velFactor = this.config.velBonusPorTorre.rapida;
    }

    if (typeof alien.velocidadMaxima === 'number') {
      alien.velocidadMaxima *= velFactor;
    }

    this.mundo.personajes.push(alien);
    this.mundo.aliens.push(alien);
     this.juego.aliens.push(alien);     
  }


  _noQuedanAliensVivos() {
    return this.mundo.aliens.every(a => !a || a.vivo === false);
  }

   /** Llamar desde Alien.morir() o desde Mundo cuando muere un alien */
  onAlienMuerto(alien) {
    // acá sumás puntaje/metal según el alien

    const score = alien.score      // 100 puntos por default
    const metal = alien.metalDrop     // 1 metal por default

    this.juego.sumarPuntaje(score)
    this.juego.sumarMetal(metal)
  }

}