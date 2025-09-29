class Alien extends GameObject{
   constructor(texture, x, y, juego) {
    super(texture, x, y, juego);
  }

  getOtrosAliens() {
    return this.juego.aliens;
  }


}
