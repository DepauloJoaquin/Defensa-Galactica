class Juego{
    pixiApp;
    aliens = [];
    ancho;
    alto;


    constructor(){
        this.ancho = 1280;
        this.alto = 720;
        this.mouse = {posicion: { x: 0, y: 0} };
        this.initPixi();
        
    }


    //async indica q este metodo es asyncronico, es decir q puede usar "await"

    async initPixi(){
           //creo la aplicacion de pixi y la guardo en la propiedad pixiAp

        this.pixiApp = new PIXI.Application();

        this.pixiApp.stage.name = "al stage";

         
      


        


        const opcionesDePixi = {
            background : "#1099bb",
            width: this.ancho,
            height: this.alto,
        };

        //inicializo pixi con las opciones definidas anteriormente
        //await indica q el codigo se frena hasta que el metodo init de la app de pixi haya terminado
        await this.pixiApp.init(opcionesDePixi);


          //agregamos el elementos canvas creado por pixi en el documento html
        document.body.appendChild(this.pixiApp.canvas);

        globalThis.__PIXI_APP__ = this.pixiApp;


        this.pixiApp.stage.sortableChildren = true;


        const imgFondo = await PIXI.Assets.load("img/mapa_1_dis.png");
        this.fondo = new PIXI.Sprite(imgFondo);
        this.fondo.anchor.set(0);
        this.fondo.position.set(0,0);
        this.fondo.width = this.ancho;
        this.fondo.height = this.alto;
        this.fondo.zIndex = -1000;
        this.pixiApp.stage.addChild(this.fondo);


      


        //cargo la imagen alien.png y la guardamos en la variable texture
        const texture = await PIXI.Assets.load("./img/alienFrente.png");

       const animacionesPersonaje = await PIXI.Assets.load("img/personaje.json");

        //console.log(json);

        //creamos 10 instancias de la clase cAlien

        for (let i = 0; i < 10; i++){
            const x = Math.random() * this.ancho;
            const y = Math.random() * this.alto;


         //crea una instancia de clase Alien, el constructor de dicha clase toma como parametros la textura
      // q queremos usar,X,Y y una referencia a la instancia del juego (this)
            const alien = new Alien(animacionesPersonaje,x,y,this);
            this.aliens.push(alien)
        }

         //agregamos el metodo this.gameLoop al ticker.
        //es decir: en cada frame vamos a ejecutar el metodo this.gameLoop

        this.pixiApp.ticker.add(this.gameloop.bind(this));
        this.agregarInteractividadDelMouse();
        //this.asignarPerseguidorRandomATodos();
        //this.asignarTargets();
        this.asignarElMouseComoTargetATodosLosAliens();
    }

    agregarInteractividadDelMouse(){
          // Escuchar el evento mousemove

          this.pixiApp.canvas.onmousemove = (event) =>{
            this.mouse.posicion = {x : event.x, y: event.y};
          };
    }

    gameloop(time){
             //iteramos por todos los aliens
        for (let unAlien of this.aliens){
               //ejecutamos el metodo tick de cada alien
            unAlien.tick();
            unAlien.render();
        }
    }

    getAlienRandom(){
        return this.aliens[Math.floor(this.aliens.length * Math.random())];
    }

    asignarTargets(){
        for(let unAlien of this.aliens){
            unAlien.asignarTarget(this.getAlienRandom());
        }
    }

    asignarElMouseComoTargetATodosLosAliens(){
        for(let unAlien of this.aliens){
            unAlien.asignarTarget(this.mouse);
        }
    }

    asignarPerseguidorRandomATodos(){
        for(let unAlien of this.aliens){
            unAlien.perseguidor = this.getAlienRandom();
        }
    }

    asignarElMouseComoPerseguidorATodosLosAliens(){
        for (let unAlien of this.aliens){
            unAlien.perseguidor = this.mouse;
        }
    }
}
