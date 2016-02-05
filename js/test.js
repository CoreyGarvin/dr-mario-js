document.addEventListener("DOMContentLoaded", function(event) {

    var cellSize = 40;
    var STAGE_WIDTH = window.innerWidth, STAGE_HEIGHT = window.innerHeight;
    var METER = 100;

    var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight*2);
        // set the canvas width and height to fill the screen
    renderer.view.style.display = "block";
    renderer.view.style.width = "100%"
    renderer.view.style.height = "100%"
    document.body.appendChild(renderer.view);

    // create the root of the scene graph
    var stage = new PIXI.Container();

    // load resources
    PIXI.loader
        .add('spritesheet','images/sprites.json')
        .load(onAssetsLoaded);

    // holder to store aliens
    var aliens = [];
    var alienFrames = ['bug.png', 'pill.png'];
    var pieces = [];

    var count = 0;

    // create an empty container
    // var alienContainer = new PIXI.Container();
    // alienContainer.position.x = 400;
    // alienContainer.position.y = 300;
    // alienContainer.rotationEnabled = true;

    var dmContainer = new PIXI.Container();
    dmContainer.position.x = 0;
    dmContainer.position.y = -150;

    // make the stage interactive
    stage.interactive = true;

    stage.addChild(dmContainer);



    var board = [
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 6, 0,12, 0,12,12,12, 6],
        [ 0, 6, 6,18,12,18, 0, 6],
        [ 0, 6,12, 0,18, 0,18, 0],
        [12,12,12, 0,18,12,12,18],
        [ 6,12, 6,12, 6, 6,12,18],
        [12,12,12, 6,12, 6, 0,12],
        [ 6,18,12, 0,18, 0, 0, 0],
        [12,12, 6,18,12,18,18,12],
        [18,12, 6,18,12, 0, 6, 0],
        [ 6, 0,12, 6,18, 6,18,18],
        [ 0,12, 0,18,18, 0, 6,18],
        [18,18, 0, 0, 6,18, 0, 0],
        [ 6,12, 6,18,12,12,18, 6],
    ];

    function onAssetsLoaded() {

        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board[i].length; j++) {
                if (board[i][j] === 0) {
                    continue;
                }
                var frameName = "bug.png";
                if (board[i][j] % 6 != 0) {
                    frameName = "pill.png";
                }
                var piece = PIXI.Sprite.fromFrame(frameName);
                piece.tint = {
                    1: 0xFF0000,
                    2: 0x0000FF,
                    3: 0xFFFF00
                }[board[i][j]/6];

                piece.position.x = j * cellSize;
                piece.position.y = i * cellSize;
                piece.width = cellSize;
                piece.height = cellSize;

                dmContainer.addChild(piece);
            }
        }

/*        // add a bunch of aliens with textures from image paths
        for (var i = 0; i < 1000; i++)
        {
            var frameName = alienFrames[i % alienFrames.length];

            // create an alien using the frame name..
            var alien = PIXI.Sprite.fromFrame(frameName);
            alien.tint = Math.random() * 0xFFFFFF;

            
             * fun fact for the day :)
             * another way of doing the above would be
             * var texture = PIXI.Texture.fromFrame(frameName);
             * var alien = new PIXI.Sprite(texture);
             
            alien.position.x = Math.random() * 1600 - 900;
            alien.position.y = Math.random() * 900 - 450;
            alien.anchor.x = 0.5;
            alien.anchor.y = 0.5;
            aliens.push(alien);
            alienContainer.addChild(alien);
        }*/

        // start animating
        requestAnimationFrame(animate);
    }

    stage.on('click', onClick);
    stage.on('tap', onClick);

    function onClick()
    {
        // alienContainer.rotationEnabled = !alienContainer.rotationEnabled;
        // alienContainer.cacheAsBitmap = !alienContainer.cacheAsBitmap;

    //        feel free to play with what's below
    //        var sprite = new PIXI.Sprite(alienContainer.generateTexture());
    //        stage.addChild(sprite);
    //        sprite.position.x = Math.random() * 800;
    //        sprite.position.y = Math.random() * 600;
    }

    function animate() {
        // let's rotate the aliens a little bit
/*        for (var i = 0; i < 1000; i++)
        {
            var alien = aliens[i];
            if (alienContainer.rotationEnabled) alien.rotation += 0.1;
        }

        count += 0.01;

        alienContainer.scale.x = Math.sin(count/3)*3;
        alienContainer.scale.y = Math.sin(count/3)*3;

        alienContainer.rotation += 0.01;*/

        // render the stage
        renderer.render(stage);

        requestAnimationFrame(animate);
    }

    document.onkeydown = function(e) {
        switch (e.keyCode) {
            case 37:
                console.log('left');
                break;
            case 38:
                console.log('up');
                break;
            case 39:
                console.log('right');
                break;
            case 40:
                console.log('down');
                break;
        }
    };
});