class FSM{
    constructor(personaje){
        this.personaje = personaje;
        this.estados = {};
        this.actual = null;
    }

    añadir(nombre,nombreInstancia){
        this.estados[nombre] = nombreInstancia;
        nombreInstancia.fsm = this;
        nombreInstancia.personaje = this.personaje;
    }

    setear(nombre){
       if(!this.estados[nombre]){
        throw new Error('Estado ${nombre}' + " no existe")
       }
       const anterior = this.actual;
       if(anterior === nombre) return;
       if(anterior && this.estados[anterior] && this.estados[anterior].exit === "function"){
        this.estados[anterior].exit(nombre)
       }
       this.actual = nombre;


    const nuevo = this.estados[this.actual];
    if (nuevo && typeof nuevo.enter === "function") {
    nuevo.enter(anterior);
    }
}

    update(dt){
        const estado = this.estados[this.actual]
        if(estado && typeof estado.update === "function"){
            estado.update(dt);
        }
    }
}