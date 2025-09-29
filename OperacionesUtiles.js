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

    if(magnitudDelVectorOriginal === 0) return {x:0, y: 0};

    const magnitud = Math.abs(nuevaMagnitud)

    const escala = magnitud / magnitudDelVectorOriginal;

    return {x: vector.x * escala, y: vector.y * escala};

}