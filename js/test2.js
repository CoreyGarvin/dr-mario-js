
(function Main() {
    var STAGE_WIDTH = window.innerWidth,
        STAGE_HEIGHT = window.innerHeight;
    var METER = 80; // Pixels per meter
    var cellSize = .25; // Meters

    var actors = [];
    var onDeck
    var container, boardContainer, simContainer, renderer, graphics;
    var world, mouseJoint;
    var touchX, touchY;
    var isBegin;
    var stats;
    var physicsEnabled = false;

    var displacementFilter = null;
    var displacementTexture = null;
    var waterWaves = null;
    var bg = null;

    var gameBoardOffsetX = 0,
        gameBoardOffsetY = 0;

    // Physics body definition
    var cellBodyDef = new Box2D.Dynamics.b2BodyDef();
    cellBodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

    var cellFixtureDef = new Box2D.Dynamics.b2FixtureDef();
    cellFixtureDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
    cellFixtureDef.density = 1;
    cellFixtureDef.shape.SetAsBox(cellSize / 2, cellSize / 2);

    const CELL_TEXTURES = {
        "Bug":          {frame: "bug.png",  rotation: 0},
        "Orphan":       {frame: "pill.png", rotation: 0},
        "Pill Piece":   {frame: "pill.png", rotation: 0},
        "Pill Top":     {frame: "pill.png", rotation: toRadians(-90)},
        "Pill Bottom":  {frame: "pill.png", rotation: toRadians( 90)},
        "Pill Left":    {frame: "pill.png", rotation: toRadians(180)},
        "Pill Right":   {frame: "pill.png", rotation: 0},
    };


    var Actor = function(cell, container, world, animated) {
        animated = animated !== false;
        var self = this;
        var cell = cell;
        var widthScale = heightScale = 1;
        var offsetX = offsetY = 0;
        var sprite = null;
        var physicsBody = null;
        this.id = cell.id;
        this.defaultPosition = null;

        var useCellPosition = function() {
            var position = cell.position || self.defaultPosition;
            if (!position) {
                return;
            }
            var targetRotation = CELL_TEXTURES[cell.type.name].rotation

            var worldPosition = new Box2D.Common.Math.b2Vec2(
                position.col * cellSize + (cellSize / 2),
                position.row * cellSize + (cellSize / 2)
            );

            if (physicsBody) {
                physicsBody.SetPositionAndAngle(
                    worldPosition, targetRotation);
            }

            // Experimenting with tweening
            if (animated) {
                sprite.position.x += (worldPosition.x * METER + offsetX - sprite.position.x) / 2;
                sprite.position.y += (worldPosition.y * METER + offsetY - sprite.position.y) / 2;
                sprite.rotation += (targetRotation - sprite.rotation) / 1.5;
            } else {
                sprite.position.x = worldPosition.x * METER + offsetX;
                sprite.position.y = worldPosition.y * METER + offsetY;
                sprite.rotation = targetRotation;
            }
            // sprite.position.set(
            //     worldPosition.x * METER,
            //     worldPosition.y * METER
            // // );
            // if (Math.abs(sprite.rotation) < 0.05) {
            //     sprite.rotation = 0;
            // } else {
                // var before = sprite.rotation;
                // sprite.rotation = sprite.rotation - (2 * Math.PI * (Math.round(sprite.rotation / (2 * Math.PI))));
                // console.log(before + ", " + sprite.rotation);
                
            // }
            // sprite.rotation = cell.type.rotation;

        };

        var usePhysicsBodyPosition = function() {
            if (!physicsBody && !initPhysics()) {
                return;
            }
            var physicsBodyPosition = physicsBody.GetPosition();
            sprite.position.set(
                physicsBodyPosition.x * METER,
                physicsBodyPosition.y * METER
            );
            sprite.rotation = physicsBody.GetAngle();
        };
        this.onUpdate = function() {
            if (!sprite && !initGraphics()) {
                return;
            }
            var side = cellSize * METER;
            if (animated) {
                sprite.width += (side * widthScale - sprite.width) / 3;
                sprite.height += (side * heightScale - sprite.height) / 3;
            } else {
                sprite.width = (side * widthScale);
                sprite.height = (side * heightScale);
            }
            if (physicsEnabled) usePhysicsBodyPosition();
            else                useCellPosition();
        }
        this.destroy = function(ms, then) {
            if (!animated) return destroyNow();
            sprite.alpha /= 2;
            sprite.tint = 0xFFFFFF;
            return new Promise(function(resolve) {
                setTimeout(function() {
                    destroyNow();
                    resolve();
                }, 1000);
            });
        };
        var destroyNow = function() {
            container.removeChild(sprite);
            actors = actors.filter(function(actor) {return actor !== self;});
            sprite && sprite.destroy();
            physicsBody && world.DestroyBody(physicsBody);
        };

        this.squishLeft = function(f) {
            var tmp = widthScale;
            widthScale = 0.95;
            offsetX = -sprite.width * (1 - widthScale) * f ;
            setTimeout(function() {
                widthScale = 1;
                offsetX = 0;
            }, 100);
        };

        var initPhysics = function() {
            if (!cell.position || !world) {
                return false;
            }
            // Physics body
            cellBodyDef.position.Set(
                cell.position.col * cellSize + (cellSize / 2),
                cell.position.row * cellSize + (cellSize / 2)
            );
            physicsBody = world.CreateBody(cellBodyDef);
            physicsBody.CreateFixture(cellFixtureDef);
            return true;
        };

        var initGraphics = function() {
            if (!cell.position && !self.defaultPosition) {
                return false;
            }
            // Graphics
            sprite = PIXI.Sprite.fromFrame(CELL_TEXTURES[cell.type.name].frame);
            sprite.tint = cell.color.value;
            // sprite.filters = [displacementFilter];
            sprite.anchor.x = sprite.anchor.y = 0.5;
            useCellPosition();
            container.addChild(sprite);
            return true;
        };

        initPhysics();
        initGraphics();
        // console.log("Actor ID " + this.id + " created");
    };

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

        // Main screen-sized container
        container = new PIXI.Container();
        // Container for the gameboard
        boardContainer = new PIXI.Container();

        simContainer = new PIXI.Container();
        

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

        // try graphics
        displacementTexture = PIXI.Sprite.fromImage("images/displacement_map.jpg");
        displacementFilter = new PIXI.filters.DisplacementFilter(displacementTexture);
        displacementFilter.scale.x = 50;
        displacementFilter.scale.y = 50;

        var pondContainer = new PIXI.Container();
        pondContainer.addChild(displacementTexture);
        pondContainer.filters = [displacementFilter];
        // container.addChild(pondContainer);

        bg = PIXI.Sprite.fromImage("images/displacement_BG.jpg");
        bg.scale.x = bg.scale.y = 2
        pondContainer.addChild(bg);

        waterWaves = new PIXI.extras.TilingSprite(PIXI.Texture.fromImage("images/zeldaWaves.png"), 630, 410);
        waterWaves.scale.x = waterWaves.scale.y = 1.3;
        waterWaves.alpha = 0.1//0.2
        pondContainer.addChild(waterWaves);
        // boardContainer.filters = [displacementFilter];

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

        var game = new DrMarioGame({name: "Main"});
        var cpuPlayer = null;
        if (false) {
            cpuPlayer = new CpuPlayer(game);
            cpuPlayer.events.register(function() {
                var simActors = [];
                var gameStateRefresh = function(g) {
                    // Remove previous actors before generating new
                    actors.filter(function(actor) {
                        return simActors.indexOf(actor) != -1;
                    }).forEach(function(actor) {actor.destroy();});

                    g.map.cells.forEach(function(cell) {
                        cellCreated(cell);
                    });
                    console.log("Length: " + actors.length);
                };

                var cellCreated = function(cell) {
                    var act = new Actor(cell, simContainer, null, false);
                    actors.push(act);
                    simActors.push(act);
                };

                return new Component("SimGraphics", {
                    // gameStateRefresh: gameStateRefresh,
                    // cellCreated: cellCreated
                });
            }());
        }

        game.events.register(function() {
            var gameInitialized = function(game) {
                return new Promise(function(resolve) {
                    game.map.cells.filter(function(cell) {
                        return !!cell;
                    })
                    .forEach(function(cell) {
                        setTimeout(function() {
                            cellCreated(cell);
                        }, Math.floor(Math.random() * 1000));
                    });
                    setTimeout(function() {
                        resolve();
                    }, 1500);
                });
            };

            var cellCreated = function(cell) {
                actors.push(new Actor(cell, boardContainer, world));
            };

            var nowOnDeck = function(cells) {
                for (var i = 0; i < cells.length; i++) {
                    var actor = actors.filter(function(a) {
                        return a.id === cells[i].id;
                    })[0].defaultPosition = new Position(1, 9.6 + i);
                }
            };

            var cellDestroyed = function(cell) {
                var actor = actors.filter(function(a) {
                    return a.id === cell.id;
                })[0];
                if (actor == null) {
                    console.log("actor null");
                } else {
                    return actor.destroy();
                }
            };

            var gameOver = function() {
                physicsEnabled = true;
            };

            return new Component("Graphics",
                {
                    gameInitialized: gameInitialized,
                    cellCreated: cellCreated,
                    cellDestroyed: cellDestroyed,
                    // nowOnDeck: nowOnDeck,
                    gameOver: gameOver,
                }
            );
        }());
        // Physics walls
        // Floor
        polyFixture.shape.SetAsBox(10, 1);
        // bodyDef.position.Set(9, STAGE_HEIGHT / METER - 2);
        bodyDef.position.Set(9, game.rows * cellSize + (cellSize*4));
        world.CreateBody(bodyDef).CreateFixture(polyFixture);
        // Left wall
        // polyFixture.shape.SetAsBox(1, 100);
        // bodyDef.position.Set(-1, 0);
        // world.CreateBody(bodyDef).CreateFixture(polyFixture);

        // Right wall
        bodyDef.position.Set(STAGE_WIDTH / METER + 1, 0);
        // world.CreateBody(bodyDef).CreateFixture(polyFixture);
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

        // Draw game border
        graphics = new PIXI.Graphics();
        graphics.alpha = 0.9;
        // graphics.beginFill(0x333333);
        // set the line style to have a width of 5 and set the color to red
        var lineWidth = .15;
        graphics.lineStyle(lineWidth*METER, 0x333333);
        graphics.beginFill(0x000000, 1);
        // draw a rectangle
        graphics.drawRect(
            -lineWidth*METER/2,
            -lineWidth*METER/2 + (cellSize * METER/2),
            lineWidth*METER/2 + (game.cols * cellSize*METER),
            lineWidth*METER/2 + (game.rows - 0) * (cellSize * METER)
        );
        // Preview piece
        graphics.drawRect(
            (game.cols + 1) * cellSize*METER + lineWidth/2*METER,
            -lineWidth*METER/2 + (cellSize * METER/2),
            3 * cellSize * METER + lineWidth*METER/2,
            3 * cellSize * METER+ lineWidth*METER/2
        );

        // Draw game border 2
        graphics2 = new PIXI.Graphics();
        graphics2.alpha = 0.9;
        // graphics.beginFill(0x333333);
        // set the line style to have a width of 5 and set the color to red
        var lineWidth = .15;
        graphics2.lineStyle(lineWidth*METER, 0x333333);
        graphics2.beginFill(0x000000, 1);
        // draw a rectangle
        graphics2.drawRect(
            -lineWidth*METER/2,
            -lineWidth*METER/2 + (cellSize * METER/2),
            lineWidth*METER/2 + (game.cols * cellSize*METER),
            lineWidth*METER/2 + (game.rows - 0) * (cellSize * METER)
        );
        // Preview piece
        graphics2.drawRect(
            (game.cols + 1) * cellSize*METER + lineWidth/2*METER,
            -lineWidth*METER/2 + (cellSize * METER/2),
            3 * cellSize * METER + lineWidth*METER/2,
            3 * cellSize * METER+ lineWidth*METER/2
        );
        simContainer.addChild(graphics2);

        var onWindowResize = function() {
            var STAGE_WIDTH = window.innerWidth,
                STAGE_HEIGHT = window.innerHeight;
            METER = STAGE_HEIGHT / (cellSize * (game.rows + 2));
            // renderer.width = STAGE_WIDTH;
            // renderer.height = STAGE_HEIGHT;
            renderer.resize(STAGE_WIDTH,STAGE_HEIGHT)

            boardContainer.position.x = gameBoardOffsetX = renderer.width  / 1.5 - (cellSize * game.cols / 2 * METER) - (0*cellSize * METER / 4);
            boardContainer.position.y = gameBoardOffsetY = renderer.height / 2 - (cellSize * game.rows / 2 * METER) - (1*cellSize * METER/2);

            simContainer.position.x = simContainer.position.y = 30;

            // graphics.position.y = cellSize * METER;
            // graphics.width = (cellSize * (game.cols + 4) * METER);
            // graphics.height = (cellSize * (game.rows-1) * METER);

            graphics.width = lineWidth*METER*4 + ((game.cols+4) * cellSize*METER);
            graphics.height = lineWidth*METER/2 + (game.rows - 0) * (cellSize * METER);

            graphics2.width = graphics.width;
            graphics2.height = graphics.height;

            waterWaves.width = bg.width = STAGE_WIDTH;
            waterWaves.height = bg.height = STAGE_HEIGHT;

        };

        window.addEventListener("resize", onWindowResize);
        onWindowResize();
        game.start();

        document.onkeydown = function(e) {
            switch (e.keyCode) {
                case 37:
                    // console.log('left');
                    game.playerMove("left");
                    // actors[Math.floor(Math.random()*actors.length)].gameCell.moveTo(0,0, true);
                    // game.settle();
                    // if (!game.playerControls.left()) {
                        // actors[10].squishLeft(.5);
                        // actors[11].squishLeft(1.5);
                    // }
                    break;
                case 38:
                    // console.log('up');
                    physicsEnabled = !physicsEnabled;
                    break;
                case 39:
                    // console.log('right');
                    game.playerMove("right");
                    break;
                case 40:
                    // console.log('down');
                    game.playerMove("down");
                    break;
                case 88:
                    game.playerControls.rotate();
                    break;
                case 90:
                    game.playerControls.rotate(true);
                    break;
                case 81:
                    cpuPlayer.showNextOption(-1);
                    break;
                case 87:
                    cpuPlayer.showNextOption();
                    break;
                case 69:
                    cpuPlayer.doneViewingOptions();
                    break;
                default:
                    console.log(e.keyCode);
            }
        };
        // simContainer.addChild(graphics2);
        boardContainer.addChild(graphics);
        container.addChild(boardContainer);
        container.addChild(simContainer);

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

            touchX = (touche.pageX + 500) / METER;
            touchY = (touche.pageY + 0) / METER;
        } else {
            touchX = (event.offsetX - gameBoardOffsetX) / METER;
            touchY = (event.offsetY - gameBoardOffsetY) / METER;
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

    function update(t) {
        // console.log(t);
        requestAnimationFrame(update);
        // METER = 80 + (50 * Math.sin(Date.now()/5000));

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
        if (physicsEnabled) {
            world.Step(1 / 60, 3, 3);
            world.ClearForces();
        }
        for (var i = 0; i < actors.length; i++) {
            actors[i].onUpdate();
        }

        // Extra gfx
        if (displacementFilter) {
            // displacementTexture.position.x += t/100;
            displacementTexture.x += 1;
            displacementTexture.y += 1;
            // displacementTexture.scale.x = Math.sin(Date.now()/1000);

            // displacementFilter.maskMatrix.r = t / 10;//blurAmount * 40;
            // displacementFilter.maskMatrix.g = t / 10;
            // displacementFilter.scale.x = 1+Math.sin(Date.now()/1000);
        }
        
        waterWaves.tilePosition.x = t / -20;//blurAmount * 40;
        waterWaves.tilePosition.y = t / -20;


        renderer.render(container);
        stats.update();
    }
})();

