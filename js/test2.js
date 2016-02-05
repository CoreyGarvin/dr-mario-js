(function Main() {
    var STAGE_WIDTH = window.innerWidth,
        STAGE_HEIGHT = window.innerHeight;
    var METER = 80; // Pixels
    var cellSize = .25; // Meters

    var bodies = [],
        actors = [];
    var container, boardContainer, renderer, graphics;
    var world, mouseJoint;
    var touchX, touchY;
    var isBegin;
    var stats;
    var physicsEnabled = false;






    var board = [
        [ 0,  0,  0,  0,  0,  0,  0,  6],
        [ 0,  0,  0,  0,  0,  0,  0,  6],
        [ 0,  0,  0,  0,  0,  0,  0,  6],
        [ 0,  0,  0,  0,  0,  0,  0,  6],
        [ 6,  0, 12,  0, 12, 12, 12,  6],
        [ 0,  6,  6, 18, 12, 18,  0,  6],
        [ 0,  6, 12,  0, 18,  0, 18,  0],
        [12, 12, 12,  0, 18, 12, 12, 18],
        [ 6, 12,  6, 12,  6,  6, 12, 18],
        [12, 12, 12,  6, 12,  6,  0, 12],
        [ 6, 18, 12,  0, 18,  0,  0,  0],
        [12, 12,  6, 18, 12, 18, 18, 12],
        [18, 12,  6, 18, 12,  0,  6,  0],
        [ 6,  0, 12,  6, 18,  6, 18, 18],
        [ 0, 12,  0, 18, 18,  0,  6, 18],
        [18, 18,  0,  0,  6, 18,  0,  0],
        [ 6, 12,  6, 18, 12, 12, 18,  6],
    ];

    (function init() {
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = (function() {
                return window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    function(callback) {
                        window.setTimeout(callback, 1000 / 60);
                    };
            })();
        }
        window.onload = onLoad;
    })();

    function onLoad() {
        const statsContainer = document.createElement("div");
        document.body.appendChild(statsContainer);

        stats = new Stats();
        statsContainer  .appendChild(stats.domElement);
        stats.domElement.style.position = "absolute";

        // stage = new PIXI.Stage(0xffffff, true);

        container = new PIXI.Container();

        boardContainer = new PIXI.Container();
        
        var options = {
            // view: document.getElementById("canvas"),
            transparent: false,
            antialias: true,
            preserveDrawingBuffer: false,
            resolution: 1
        };
        renderer = PIXI.autoDetectRenderer(STAGE_WIDTH, STAGE_HEIGHT, options, false);
        renderer.autoResize = true;
        document.body.appendChild(renderer.view);

        graphics = new PIXI.Graphics();
        graphics.alpha = 0.6;
        // graphics.beginFill(0x333333);

        // set the line style to have a width of 5 and set the color to red
        graphics.lineStyle(5, 0x993333);

        // draw a rectangle
        graphics.drawRect(-2.5, -2.5, board[0].length*cellSize*METER + 20, board.length*cellSize*METER + 20);

        var onWindowResize = function() {
            var STAGE_WIDTH = window.innerWidth,
                STAGE_HEIGHT = window.innerHeight;
            METER = STAGE_HEIGHT / (cellSize * (board.length + 5));
            // renderer.width = STAGE_WIDTH;
            // renderer.height = STAGE_HEIGHT;
            renderer.resize(STAGE_WIDTH,STAGE_HEIGHT)
            boardContainer.position.x = renderer.width  / 2 - (cellSize * board[0].length / 2 * METER) - (0*cellSize * METER / 4);
            boardContainer.position.y = renderer.height / 2 - (cellSize * board.length / 2 * METER) - (0*cellSize * METER/ 4);
            graphics.width = (cellSize * board[0].length * METER + 12.5);
            graphics.height = (cellSize * board.length * METER + 12.5);
        };

        window.addEventListener("resize", onWindowResize);
        onWindowResize();
        // load resources
        PIXI.loader
            .add('spritesheet','images/sprites.json')
            .load(onAssetsLoaded);
    }

    function onAssetsLoaded() {
        world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 10), true);

        const polyFixture = new Box2D.Dynamics.b2FixtureDef();
        polyFixture.shape = new Box2D.Collision.Shapes.b2PolygonShape();
        polyFixture.density = 1;

        const circleFixture = new Box2D.Dynamics.b2FixtureDef();
        circleFixture.shape = new Box2D.Collision.Shapes.b2CircleShape();
        circleFixture.density = 1;
        circleFixture.restitution = 0.7;

        const bodyDef = new Box2D.Dynamics.b2BodyDef();
        bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;

        //down
        polyFixture.shape.SetAsBox(10, 1);
        // bodyDef.position.Set(9, STAGE_HEIGHT / METER - 2);
        bodyDef.position.Set(9, board.length * cellSize + (cellSize*4));
        world.CreateBody(bodyDef).CreateFixture(polyFixture);

        //left
        // polyFixture.shape.SetAsBox(1, 100);
        // bodyDef.position.Set(-1, 0);
        // world.CreateBody(bodyDef).CreateFixture(polyFixture);

        //right
        bodyDef.position.Set(STAGE_WIDTH / METER + 1, 0);
        // world.CreateBody(bodyDef).CreateFixture(polyFixture);
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

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

        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board[i].length; j++) {
                if (board[i][j] === 0) {
                    continue;
                }
                // Physics body
                bodyDef.position.Set(j * cellSize + (cellSize / 2), i * cellSize + (cellSize / 2));
                var body = world.CreateBody(bodyDef);

                polyFixture.shape.SetAsBox(cellSize / 2, cellSize / 2);
                body.CreateFixture(polyFixture);
                bodies.push(body);

                // Graphics
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

                var bodyPosition = body.GetPosition();
                piece.position.x = bodyPosition.x * METER;
                piece.position.y = bodyPosition.y * METER;
                // piece.position.x = j * cellSize * METER;
                // piece.position.y = i * cellSize * METER;
                piece.anchor.x = piece.anchor.y = 0.5;
                piece.width = cellSize * METER;
                piece.height = cellSize * METER;
                piece.i = i;
                actors[actors.length] = piece;
                boardContainer.addChild(piece);
            }
        }



        boardContainer.addChild(graphics);
        container.addChild(boardContainer);


        renderer.view.addEventListener("mousedown", function(event) {
            isBegin = true;
            onMove(event);
            document.addEventListener("mousemove", onMove, true);
        }, true);

        renderer.view.addEventListener("mouseup", function(event) {
            document.removeEventListener("mousemove", onMove, true);
            isBegin = false;
            touchX = undefined;
            touchY = undefined;
        }, true);

        renderer.view.addEventListener("touchstart", function(event) {
            isBegin = true;
            onMove(event);
            renderer.view.addEventListener("touchmove", onMove, true);
        }, true);

        renderer.view.addEventListener("touchend", function(event) {
            renderer.view.removeEventListener("touchmove", onMove, true);
            isBegin = false;
            touchX = undefined;
            touchY = undefined;
        }, true);


        update();
    }

    function onMove(event) {
        if (event["changedTouches"]) {
            var touche = event["changedTouches"][ 0];

            touchX = touche.pageX / METER;
            touchY = touche.pageY / METER;
        } else {
            touchX = event.offsetX / METER;
            touchY = event.offsetY / METER;
        }
    }

    function getBodyAtMouse() {
        const mousePos = new Box2D.Common.Math.b2Vec2(touchX, touchY);
        const aabb = new Box2D.Collision.b2AABB();
        aabb.lowerBound.Set(touchX - 0.001, touchY - 0.001);
        aabb.upperBound.Set(touchX + 0.001, touchY + 0.001);

        var body;
        world.QueryAABB(
            function(fixture) {
                if (fixture.GetBody().GetType() != Box2D.Dynamics.b2BodyDef.b2_staticBody) {
                    if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePos)) {
                        body = fixture.GetBody();
                        return false;
                    }
                }
                return true;
            }, aabb);

        return body;
    }

    function update() {
        requestAnimationFrame(update);
        // METER = 80 + (10 * Math.sin(Date.now()/1000));

        if (isBegin && !mouseJoint) {
            const dragBody = getBodyAtMouse();
            if (dragBody) {
                const jointDef = new Box2D.Dynamics.Joints.b2MouseJointDef();
                jointDef.bodyA = world.GetGroundBody();
                jointDef.bodyB = dragBody;
                jointDef.target.Set(touchX, touchY);
                jointDef.collideConnected = true;
                jointDef.maxForce = 300.0 * dragBody.GetMass();
                mouseJoint = world.CreateJoint(jointDef);
                dragBody.SetAwake(true);
            }
        }

        if (mouseJoint) {
            if (isBegin)
                mouseJoint.SetTarget(new Box2D.Common.Math.b2Vec2(touchX, touchY));
            else {
                world.DestroyJoint(mouseJoint);
                mouseJoint = null;
            }
        }
        if (!physicsEnabled) {
            world.Step(1 / 60, 3, 3);
            world.ClearForces();
            // physicsEnabled = false;


        }
        // Position actors to match physics bodies
        const n = actors.length;
        for (var i = 0; i < n; i++) {
            var body = bodies[i];
            var actor = actors[i];
            var position = body.GetPosition();
            actor.position.x = position.x * METER;
            actor.position.y = position.y * METER;
            actor.width = cellSize * METER;
            actor.height = cellSize * METER;
            actor.rotation = body.GetAngle();
        }
        renderer.render(container);
        stats.update();
    }
})();

