let html = document.querySelector('html')
// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 899;
var GAME_HEIGHT = 512;

var ENEMY_WIDTH = 78;
var ENEMY_HEIGHT = 87;
var MAX_ENEMIES = 3;

var ARROW_WIDTH = 78;
var ARROW_HEIGHT = 78;
var MAX_ARROWS = 1;

var PLAYER_WIDTH = 78;
var PLAYER_HEIGHT = 153;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';

// Preload game images
let imageFilenames = ['enemy.png', 'gameArea.png', 'player.png', 'playerFlipped.png', 'arrow.png']
var images = {};

//Preload audio files
let audio = new Audio('suspiria.mp3')
audio.loop = true;
let wolfHowl = new Audio('wolf_howl.mp3');
let growl = new Audio ('growl.mp3');

imageFilenames.forEach(function(imgName) {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});





// This section is where you will be doing most of your coding
class Entity {

    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}

class Enemy extends Entity {
    constructor(xPos) {
        super()
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

}

class Arrow extends Entity {
    constructor(xPos) {
        super()
        this.x = xPos;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT -100;
        this.sprite = images['arrow.png'];

        // Speed of arrow
        this.speed = 0.5;
    }

    update(timeDiff) {
        this.y = this.y - (timeDiff * this.speed);
    }

}

class Player extends Entity {
    constructor() {
        super()
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];
        this.lifeCount = 3;
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
            this.sprite = images['playerFlipped.png']
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
            this.sprite = images['player.png'];
        }
    }

}





/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup arrows
        this.setupArrow();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }


    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(function(){return true}).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
       
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;
        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (enemySpot === undefined || this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
    }

    setupArrow() {
        if (!this.arrows) {
            this.arrows = [];
        }

        while (this.arrows.filter(function(){return true}).length < MAX_ARROWS) {
            this.addArrow();
        }
    }

    // This method places the arrow at the appropriate spot
    addArrow() {
        var arrowSpot = this.player.x;
        this.arrows[0] = new Arrow(arrowSpot);
    }

    // This method kicks off the game
    start() {
        
        audio.play()
        this.score = 0;
        this.lastFrame = Date.now();
        let keydownHandler = function (e) {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
        }
        keydownHandler = keydownHandler.bind(this)
        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', keydownHandler);

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(function (enemy) { enemy.update(timeDiff) });
        this.arrows.forEach(function (arrow) { arrow.update(timeDiff) });

        // Draw everything!
        this.ctx.drawImage(images['gameArea.png'], 0, 0); // draw the background
        let renderEnemy = function(enemy) {
            enemy.render(this.ctx)
        }
        let renderArrow = function(arrow) {
            arrow.render(this.ctx)
        }
        
        renderEnemy = renderEnemy.bind(this)
        renderArrow = renderArrow.bind(this)
        this.enemies.forEach(renderEnemy); // draw the enemies
        this.player.render(this.ctx); // draw the player
        this.arrows.forEach(renderArrow); // draw the arrow
       

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });
        this.setupEnemies();

        // Check if player is dead
        if (this.isPlayerDead()) {
            growl.play();
            this.player.lifeCount--;
            // If they are out of lives, then it's game over! 
            if (this.player.lifeCount === 0){
                this.createEndPage()
            } else {
                this.enemies = [];
                this.drawScore();
            }
        }
        else {
           this.drawScore();
        }
        
    }
    

    isPlayerDead() {
        let isDead = false
        let playerPos = this.player.x
        this.enemies.forEach(function (enemy) {
            if ((enemy.y + ENEMY_HEIGHT) >= 349 && enemy.x === playerPos) {
                isDead = true
            }
            
        })
        return isDead
        
        // TODO: fix this function!
        
    }

    drawScore() {
        // If player is not dead, then draw the score
        this.ctx.font = 'bold 30px Impact';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(this.score, 5, 30);
        this.ctx.fillText('Lives ' + this.player.lifeCount, GAME_WIDTH-100, 30);

        // Set the time marker and redraw
        this.lastFrame = Date.now();
        requestAnimationFrame(this.gameLoop);
    }

    createEndPage() {
        wolfHowl.play()
        let finalScore = document.createElement('h2')
        finalScore.innerText = this.score.toString()
        let app = document.getElementById('app')
        app.innerHTML = ''
        let imageArea = document.getElementById('imageArea')
        let endImage = document.createElement('img')
        endImage.setAttribute('src', 'images/endGame.png')
        let endPage = document.getElementById('endPage')
        let gameOver = document.createElement('h2')
        gameOver.innerText = 'The Big Bad Wolf got Red! Your score is: '
        let restartBut = document.createElement('button')
        restartBut.innerText = 'Restart'
        app.appendChild(gameOver)
        app.appendChild(finalScore)
        imageArea.appendChild(endImage)          
        endPage.appendChild(restartBut)
        audio.pause();
        audio.currentTime = 0;
        restartBut.addEventListener ('click', function () {
            endPage.innerHTML = ''
            app.innerHTML = ''
            imageArea.innerHTML = ''
            let gameEngine = new Engine(document.getElementById('app'));
            gameEngine.start();
        })
    }
}


let startBut = document.getElementById('startBut')
startBut.addEventListener ('click', function() {
    let startPage = document.getElementById("startPage")
    startPage.innerHTML = ''
    // This section will start the game
    var gameEngine = new Engine(document.getElementById('app'));
    gameEngine.start();
})

