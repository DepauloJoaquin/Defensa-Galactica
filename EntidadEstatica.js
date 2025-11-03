class EntidadEstatica extends GameObject{
    constructor(x,y,juego){
        super(undefined,x,y,juego);
        this.radio = 20;
        this.sprite = null;
        this.render();
    }
    tick(){}
}