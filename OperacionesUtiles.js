function radianesAGrados(radianes){
    return radianes *( 180/ Math.PI);
}

function calcularDistancia(obj1,obj2){
    const diferenciaX = (obj2.x - obj1.x)**2;
    const diferenciaY = (obj2.y - obj1.y)**2;
    return Math.sqrt(diferenciaX + diferenciaY);
}

function limitarVector(vector,magnitudMaxima){
    const magnitudActual = Math.sqrt(vector.x **2 + vector.y **2);

    if(magnitudActual > magnitudMaxima){
        const escala = magnitudMaxima / magnitudActual;

        return{
            x: vector.x * escala,
            y: vector.y * escala,
        };
    }

     // Si ya está dentro del límite, se devuelve igual
  return { ...vector };
}

function setearMagnitudAVector(vector,nuevaMagnitud){
    const magnitudDelVectorOriginal = Math.hypot(vector.x,vector.y);

   const EPS = 1e-8;
  if (!Number.isFinite(magnitudDelVectorOriginal) || magnitudDelVectorOriginal < EPS) return { x: 0, y: 0 };


    const magnitud = Math.abs(nuevaMagnitud)

    const escala = magnitud / magnitudDelVectorOriginal;

    return {x: vector.x * escala, y: vector.y * escala};

}

function anguloHacia(x1,y1,x2,y2){
  return Math.atan2(y2 - y1, x2 - x1);
}

function // Diferencia mínima entre dos ángulos (en valor absoluto)
deltaAng(a, b){
  let d = a - b;
  while (d >  Math.PI) d -= Math.PI*2;
  while (d < -Math.PI) d += Math.PI*2;
  return Math.abs(d);
}

// Distancia al cuadrado (evita sqrt caro)
function dist2(ax,ay,bx,by){
  const dx = ax - bx, dy = ay - by;
  return dx*dx + dy*dy;
}

function dist2Prota(personaje){  // Utilidad: distancia^2 al jugador
  const p = personaje && personaje.juego;
  if (!p) return null;
  return dist2(owner.posicion.x, owner.posicion.y, p.x, p.y);
}



