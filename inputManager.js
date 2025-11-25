class InputManager{
    constructor(juego) {
    this.juego = juego;
    this.mundo = juego.mundo;   // atajo

    this._setupKeyboard();
    this._setupMouse();
  }

   // ---------- TECLADO ----------
  _setupKeyboard() {
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      this.juego.keys[key] = true;
      
    });

    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      delete this.juego.keys[key];
    });
  }

  // ---------- MOUSE (movimiento, disparo, zoom) ----------

   _setupMouse() {
    const canvas = this.juego.pixiApp.canvas;
    if (!canvas) return;

    
    const mundo = this.mundo;
    const juego = this.juego;

    // --- Posición del mouse dentro del canvas ---
  const actualizarPosMouse = (e) => {
    const rect = canvas.getBoundingClientRect();
    mundo.mouse.posicion.x = e.clientX - rect.left;
    mundo.mouse.posicion.y = e.clientY - rect.top;
  };

   canvas.addEventListener("mousemove", actualizarPosMouse);

    // --- Disparo con botón izquierdo ---
  const setDisparo = (disparando) => (e) => {
    if (e.button === 0) {
        actualizarPosMouse(e);    
      juego._shooting = disparando;
    }
  };

   canvas.addEventListener("mousedown", setDisparo(true));
   window.addEventListener("mouseup", setDisparo(false));

    // --- Zoom con la rueda del mouse --- 
    canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      const direccion = e.deltaY > 0 ? -1 : 1;  // cambiar si sientes el zoom "al revés"
      const step = mundo.zoomStep ?? 0.1;

      const nuevoZoom = clamp(
        mundo.zoom + direccion * step,
        mundo.minZoom,
        mundo.maxZoom
      );

      mundo.zoom = nuevoZoom;
    },
    { passive: false }
  );

}
}