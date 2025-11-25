const GAME_CONFIG = {
  mapa: {
    ancho: 2560,
    alto: 1440,
  },
  zoom: {
    initial: 1,
    min: 0.4,
    max: 2,
    step: 0.1,
  },


 
  recursos: {
    metalInicial: 15,   
  },

  // 👉 NUEVO
  jugador: {
    fireRate: 2,
    bala: {
      velocidad: 900,
      daño: 35,
      vida: 1.2,
      radio: 4,
    },
      },


  oleadas: {
    baseSize: 5,            // aliens en la oleada 1
    growth: 3,              // +3 aliens por oleada
    spawnInterval: 0,     // segundos entre alien y alien
    horizontalSpread: 240,  // dispersión horizontal
    vidaExtraPorOleada: 10,
    dañoExtraPorOleada: 2,
    dañoExtraPorTorre: 0.5,
    velBonusPorTorre: {
      lenta: 1.0,
      media: 1.5,
      rapida: 2.0,
    },
  },

  
};

