(function (lineapp, undefined) {
    var ctx, canvas, lines, gravitationSource, initTime, timeSpan, lineHostIndex, lineNumbers;
	
    //Eigenschaften die von extern setzbar sind
    lineapp.connectionWidth = 0.3;
    lineapp.strokeWidth = 2;
    lineapp.strokeRadius = 15;
    lineapp.speedFaktor = 0.02;
    lineapp.gravitationForceFaktor = 7;
    lineapp.connectionRadius = 50;
    lineapp.lineCount = 50;
    lineapp.showPhysics = false;


    lineapp.connectionWidthChange = function (value) {
        lineapp.connectionWidth = value;
    };

    lineapp.strokeWidthChange = function (value) {
        lineapp.strokeWidth = value;
    };

    lineapp.connectionRadiusChange = function (value) {
        lineapp.connectionRadius = value;
    };
    
    lineapp.showPhysicsChange = function (element) {
            $("#showPhysicsDisplay").text(element.checked);
        lineapp.showPhysics = element.checked;
    };
	
    //Presets Change
    lineapp.presetsChange = function (lineCount, speedFaktor, strokeRadius, gravitationForceFaktor) {
        lineapp.strokeRadius = strokeRadius * 1;
        lineapp.speedFaktor = speedFaktor * 1;
        lineapp.gravitationForceFaktor = Math.pow(2, gravitationForceFaktor * 1);
        lineapp.lineCount = lineCount * 1;
        window.clearInterval(lineapp.interval);
        lineapp.init();
    };
	
    //Line Objekt definition
    function Line(x, y) {
        var self = this; //neu
        this.direction = (Math.floor((Math.random() * 1.5) + 0)) == 1 ? -1 : 1;
        this.angle = (Math.floor((Math.random() * 359) + 0));
        //this.speed = ((Math.random() * 0.6) + 0.1) * 1.5 //; * this.direction;
        this.speed = ((Math.random() * 0.6) + 0.1) * lineapp.speedFaktor //; * this.direction;
        this.speedR = this.speed * 200;
        this.radius = lineapp.strokeRadius;
        this.x = x;
        this.x1 = x + 2 * this.radius;
        this.y = y;
        this.y1 = y;
        this.centerX = function () {
            return (this.x + this.x1) * 0.5
        };
        this.centerY = function () {
            return (this.y + this.y1) * 0.5
        };
        this.color = "#FFFFFF";
        //neu
        this.center = {
            mass: (Math.random() * 0.01) + 0.05,
            centerX: function () {
                return (self.x + self.x1) * 0.5
            },
            centerY: function () {
                return (self.y + self.y1) * 0.5
            },
            vx: (Math.random() * -1) + 1, // velocities
            vy: (Math.random() * -1) + 1,
            fx: 0, // forces we will accumulate
            fy: 0
        };
        this.moveX = Math.random() * canvas.width;
        this.moveY = Math.random() * canvas.height;

        this.add = function (adderX, adderY) {
            this.x += adderX;
            this.x1 += adderX;
            this.y += adderY;
            this.y1 += adderY;
        }

        this.sub = function (subX, subY) {
            this.x -= subX;
            this.x1 -= subX;
            this.y -= subY;
            this.y1 -= subY;
        }

        this.setNewPosition = function (nx, ny, nx1, ny1, angle) {
            this.angle = angle;
            this.x = nx;
            this.y = ny;
            this.x1 = nx1;
            this.y1 = ny1;
        }

        this.getNormVector = function () {
            var vector = self.getVector();
            var length = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
            var nVector = {
                x: vector.x / length,
                y: vector.y / length
            };
            return nVector;
        }

        this.getVector = function () {
            var vector = {
                x: self.moveX - self.centerX(),
                y: self.moveY - self.centerY()
            };
            return vector;
        }
    }

    function setNewMovePositionForLinesInRadius(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        //alert("Canvas clicked x:" + x +" y:" + y);
        var linesInRadius = getLinesInOrbitAroundPoint({ x: x, y: y }, 400);
        for (var i = 0; i < linesInRadius.length; i++) {
            //reset gravitation forces when clicking the canvas
            var p = linesInRadius[i].center;
            p.fx = 0;
            p.fy = 0;
            var vector = {
                x: linesInRadius[i].centerX() - x,
                y: linesInRadius[i].centerY() - y
            };
            var length = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
            var newMoveVector = {
                x: vector.x / length,
                y: vector.y / length
            };
            linesInRadius[i].moveX = (linesInRadius[i].centerX() + newMoveVector.x * (10000 / length));
            linesInRadius[i].moveY = (linesInRadius[i].centerY() + newMoveVector.y * (10000 / length));
            if (linesInRadius[i].moveX > canvas.width) {
                linesInRadius[i].moveX = canvas.width;
            }
            if (linesInRadius[i].moveX < 0) {
                linesInRadius[i].moveX = 0;
            }
            if (linesInRadius[i].moveY > canvas.height) {
                linesInRadius[i].moveY = canvas.height;
            }
            if (linesInRadius[i].moveY < 0) {
                linesInRadius[i].moveY = 0;
            }
            linesInRadius[i].speed = ((Math.random() * 0.6) + 0.1) * 0.2;
        }
    };

    function getLinesInOrbitAroundPoint(point, orbit) {
        var orbitLines = [];
        for (var i = 0; i < lines.length; i++) {
            var distance = Math.sqrt(Math.pow(point.x - lines[i].centerX(), 2) + Math.pow(point.y - lines[i].centerY(), 2));
            if (distance <= orbit) {
                orbitLines.push(lines[i]);
            }
        }
        return orbitLines;
    }
	
    // Grundlegende Elemente und Eigenschaften der App
    lineapp.init = function () {
        canvas = document.getElementById("myCanvas");
        canvas.height = 750//window.innerHeight;
        canvas.width = canvas.height * 1.6//window.innerWidth;
        canvas.onclick = setNewMovePositionForLinesInRadius;
        ctx = canvas.getContext("2d");

        lineNumbers = lineapp.lineCount * 1;
        // lines Array erstellen und f�llen, x y Werte generieren
        lines = new Array(lineNumbers); //(Math.floor(canvas.width * canvas.height * 0.0003));
        for (var i = 0; i < lines.length; i++) {
            var randomX = Math.floor((Math.random() * (canvas.width - 40)) + 1);
            var randomY = Math.floor((Math.random() * (canvas.height - 40)) + 1);
            lines[i] = new Line(randomX, randomY);
        }

        // Grav Point instanzieren
        gravitationSource = {
            mass: (Math.random() * 3 * lineapp.gravitationForceFaktor) + 2 * lineapp.gravitationForceFaktor,
            centerX: canvas.width / 2,
            centerY: canvas.height / 2,
            radius: 25,
            color: "#666871"
        };

        // Daten für Uhr
        initTime = new Date();
        timeSpan = (Math.floor((Math.random() * 7) + 4));
        lineHostIndex = Math.floor((Math.random() * (lineNumbers - 1)) + 0);

        play();
    }

    // Ablauf im Canvas Fenster
    function play() {
        lineapp.interval = window.setInterval(function () {
            moveGraviationSource();
            //setLineHost();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            //rotateMove();
            calculateNewPositions();
            draw();
            connect();
        }, 25);
    }
	
    //neu
    function calculateNewPositions() {
        //computeForcesLines();
        computeForces();
        integrateAccelerations();
        rotateMove();
    }

    /*function setLineHost() {
        var now = new Date();
        var dif = now.getTime() - initTime.getTime();
        var Seconds_from_T1_to_T2 = dif / 1000;
        var Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);

        if (Seconds_Between_Dates >= timeSpan) {
            initTime = new Date;
            timeSpan = (Math.floor((Math.random() * 12) + 8));
            lineHostIndex = Math.floor((Math.random() * (lineNumbers - 1)) + 0);
        };
    }; */

    // neuen Gravitationspunkt zwischen 8 und 12 Sekunden erstellen	
    function moveGraviationSource() {
        var now = new Date();
        var dif = now.getTime() - initTime.getTime();
        var Seconds_from_T1_to_T2 = dif / 1000;
        var Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);

        if (Seconds_Between_Dates >= timeSpan) {
            gravitationSource.mass = (Math.random() * 3 * lineapp.gravitationForceFaktor) + 2 * lineapp.gravitationForceFaktor;
            initTime = new Date;
            timeSpan = Math.floor((Math.random() * 12) + 8);
            gravitationSource.centerX = Math.floor((Math.random() * (canvas.width - canvas.width * 0.3)) + canvas.width * 0.2);
            gravitationSource.centerY = Math.floor((Math.random() * (canvas.height - canvas.height * 0.3)) + canvas.height * 0.2);
        };
    };

    // Hintergrund erstellen und zeichnen
    function background() {
        ctx.fillStyle = "#26282F";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Linien und Grav Point zeichnen und ruft background() auf 
    function draw() {
        background();
        
        ctx.fillStyle = gravitationSource.color;
        ctx.beginPath();
        ctx.arc(gravitationSource.centerX, gravitationSource.centerY, gravitationSource.radius, 0, Math.PI * 2);
        ctx.fill();
        
        lines.forEach(function (line, index) {
            /*if (index == lineHostIndex) {
                ctx.lineWidth = 6;
            } else {
                ctx.lineWidth = 2;
            }*/
            ctx.lineWidth = lineapp.strokeWidth;
            ctx.strokeStyle = line.color;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x1, line.y1);
            ctx.stroke();

            if (lineapp.showPhysics) {
                //Zielline zeichnen
                ctx.strokeStyle = "#4BFFEB"; 
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(line.centerX(), line.centerY());
                ctx.lineTo(line.moveX, line.moveY);
                ctx.stroke();
			
                //Normalisierter Vektor zeichnen
                /*ctx.fillStyle = "green";
                ctx.beginPath();
                ctx.arc(line.centerX() + line.getNormVector().x * 200, line.centerY() + line.getNormVector().y * 200, 2, 0, Math.PI * 2);
                ctx.fill();*/
            
                //Zielpunkt zeichnen
                ctx.fillStyle = "#c2c2c2";
                ctx.beginPath();
                ctx.arc(line.moveX, line.moveY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
			
            //Durschnittsvektor zeichnen
			/*ctx.fillStyle = "blue";
			ctx.beginPath();
			ctx.arc(line.newMove.x, line.newMove.y, 5, 0, Math.PI * 2);
			ctx.fill();
			
			//NewMoveVektor zeichnen
			ctx.fillStyle = "white";
			ctx.beginPath();
			ctx.arc(line.newMoveVector.x, line.newMoveVector.y, 5, 0, Math.PI * 2);
			ctx.fill();*/
        });
        
    }

    // Abstand der Linien �berpr�fen und ggf. Verbindungslinien zeichnen
    function connect() {
        var connectionWidth = lineapp.connectionWidth;
        for (var i = 0; i < lines.length; i++) {
            for (var j = 0; j < lines.length; j++) {
                if (
                    lines[i] != lines[j] &&
                    Math.sqrt(
                        (lines[i].x - lines[j].x) * (lines[i].x - lines[j].x) +
                        (lines[i].y - lines[j].y) * (lines[i].y - lines[j].y)
                        ) < lineapp.connectionRadius
                    ) {
                    ctx.beginPath();
                    ctx.moveTo(lines[i].x, lines[i].y);
                    ctx.lineTo(lines[j].x, lines[j].y);
                    ctx.closePath();
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = connectionWidth;
                    ctx.stroke();
                }
                if (
                    lines[i] != lines[j] &&
                    Math.sqrt(
                        (lines[i].x1 - lines[j].x1) * (lines[i].x1 - lines[j].x1) +
                        (lines[i].y1 - lines[j].y1) * (lines[i].y1 - lines[j].y1)
                        ) < lineapp.connectionRadius
                    ) {
                    ctx.beginPath();
                    ctx.moveTo(lines[i].x1, lines[i].y1);
                    ctx.lineTo(lines[j].x1, lines[j].y1);
                    ctx.closePath();
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = connectionWidth;
                    ctx.stroke();
                }
                if (
                    lines[i] != lines[j] &&
                    Math.sqrt(
                        (lines[i].x - lines[j].x1) * (lines[i].x - lines[j].x1) +
                        (lines[i].y - lines[j].y1) * (lines[i].y - lines[j].y1)
                        ) < lineapp.connectionRadius
                    ) {
                    ctx.beginPath();
                    ctx.moveTo(lines[i].x, lines[i].y);
                    ctx.lineTo(lines[j].x1, lines[j].y1);
                    ctx.closePath();
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = connectionWidth;
                    ctx.stroke();
                }
                if (
                    lines[i] != lines[j] &&
                    Math.sqrt(
                        (lines[i].x1 - lines[j].x) * (lines[i].x1 - lines[j].x) +
                        (lines[i].y1 - lines[j].y) * (lines[i].y1 - lines[j].y)
                        ) < lineapp.connectionRadius
                    ) {
                    ctx.beginPath();
                    ctx.moveTo(lines[i].x1, lines[i].y1);
                    ctx.lineTo(lines[j].x, lines[j].y);
                    ctx.closePath();
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = connectionWidth;
                    ctx.stroke();
                }
            }
        }
    }

    // Bewegt Linien und lässt sie am Bildschirmrand abstoßen
    function move(i) {
        var r = lines[i].radius;
        if (
            lines[i].moveX >= lines[i].centerX() - r &&
            lines[i].moveX <= lines[i].centerX() + r
            ) {
            lines[i].moveX = Math.floor((Math.random() * (canvas.width - r * 2)) + r * 2);
        } else if (lines[i].moveX < lines[i].x) {
            lines[i].x -= lines[i].speed;
            lines[i].x1 -= lines[i].speed;
        } else if (lines[i].moveX > lines[i].x) {
            lines[i].x += lines[i].speed;
            lines[i].x1 += lines[i].speed;
        }
        if (
            lines[i].moveY >= lines[i].centerY() - r &&
            lines[i].moveY <= lines[i].centerY() + r
            ) {
            lines[i].moveY = Math.floor((Math.random() * (canvas.height - r * 2)) + r * 2);
        } else if (lines[i].moveY < lines[i].y) {
            lines[i].y -= lines[i].speed;
            lines[i].y1 -= lines[i].speed;
        } else if (lines[i].moveY > lines[i].y) {
            lines[i].y += lines[i].speed;
            lines[i].y1 += lines[i].speed;
        }

        /*if(
        	lines[i].moveX >= lines[i].x1 - 5 &&
        	lines[i].moveX <= lines[i].x1 + 5
        ){
        	lines[i].moveX = Math.random() * canvas.width;
        }
        else if(lines[i].moveX < lines[i].x1) lines[i].x1 -= lines[i].speed;
        else if(lines[i].moveX > lines[i].x1) lines[i].x1 += lines[i].speed;
        if(
        lines[i].moveY >= lines[i].y1 - 5 &&
        lines[i].moveY <= lines[i].y1 + 5
        ){
        lines[i].moveY = Math.random() * canvas.height;
        }
        else if(lines[i].moveY < lines[i].y1) lines[i].y1 -= lines[i].speed;
        else if(lines[i].moveY > lines[i].y1) lines[i].y1 += lines[i].speed;*/
    }
	
    // ruft move() auf und l�sst die Linien anschlie�end rotieren
    function rotateMove() {
        for (var i = 0; i < lines.length; i++) {
            //move(i);
            moveNew(i);
            var angle = (lines[i].angle + lines[i].speedR) * (Math.PI / 180);
            var curPoint = lines[i];
            var curcenterX = lines[i].centerX();
            var curcenterY = lines[i].centerY();
            var x, y, x1, y1;
            x = Math.cos(angle) * (curPoint.x - curcenterX) - Math.sin(angle) * (curPoint.y - curcenterY) + curcenterX;
            y = Math.sin(angle) * (curPoint.x - curcenterX) + Math.cos(angle) * (curPoint.y - curcenterY) + curcenterY;
            x1 = Math.cos(angle) * (curPoint.x1 - curcenterX) - Math.sin(angle) * (curPoint.y1 - curcenterY) + curcenterX;
            y1 = Math.sin(angle) * (curPoint.x1 - curcenterX) + Math.cos(angle) * (curPoint.y1 - curcenterY) + curcenterY;
            lines[i].setNewPosition(x, y, x1, y1, angle);
        }
    }

    //Bewegung einer Linie berechnen mit Berücksichtigung anderer Linien in einem Orbit um das Linecenter
    function moveNew(i) {
        var r = lines[i].radius;
        var vectorLength = r * 2;
        lines[i].newMoveVector = getNewMoveVector(lines[i], vectorLength);
        lines[i].newMove = getNewMoveCoordinates(lines[i].newMoveVector, lines[i]);
        //lines[i].moveX = newMove.x;
        //lines[i].moveY = newMove.y;
        //lines[i].acceleration += lines[i].speed;
        var xMove = (lines[i].moveX - lines[i].centerX()) * lines[i].speed;
        var yMove = (lines[i].moveY - lines[i].centerY()) * lines[i].speed;

        lines[i].x = lines[i].x + xMove;
        lines[i].x1 = lines[i].x1 + xMove;
        lines[i].y = lines[i].y + yMove;
        lines[i].y1 = lines[i].y1 + yMove;

        if (lines[i].x <= lines[i].moveX + r && lines[i].x >= lines[i].moveX - r) {
            lines[i].moveX = Math.floor((Math.random() * (canvas.width - r * 2)) + r * 2);
            lines[i].moveY = Math.floor((Math.random() * (canvas.height - r * 2)) + r * 2);
            lines[i].speed = ((Math.random() * 0.6) + 0.1) * lineapp.speedFaktor;
            //lines[i].acceleration = 0;
        }
    }
	
    //
    function getNewMoveCoordinates(vector, line) {
        var newMoveCoordinate = {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0
        };
        var first = true;
        var r = line.radius;
        var a = vector.y / vector.x;
        var m = (((-1 * line.centerX()) * vector.y) / vector.x) + line.centerY();
		
        //check left
        var bLeft = 2 * r;
        var nLeft = 0;
        if (bLeft != a && first) {
            newMoveCoordinate.x1 = (m - nLeft) / (bLeft - a);
            newMoveCoordinate.y1 = a * newMoveCoordinate.x + m;
            first = false;
        }
		
        //check right
        var bRight = canvas.width - 2 * r;
        var nRight = 0;
        if (bRight != a && first) {
            newMoveCoordinate.x1 = (m - nRight) / (bRight - a);
            newMoveCoordinate.y1 = a * newMoveCoordinate.x1 + m;
            first = false;
        } else if (bRight != a) {
            newMoveCoordinate.x2 = (m - nRight) / (bRight - a);
            newMoveCoordinate.y2 = a * newMoveCoordinate.x2 + m;
        }
		
        //check bottom
        var bBottom = 0;
        var nBottom = canvas.height - 2 * r;
        if (bBottom != a && first) {
            newMoveCoordinate.x1 = (m - nBottom) / (bBottom - a);
            newMoveCoordinate.y1 = a * newMoveCoordinate.x1 + m;
            first = false;
        } else if (bBottom != a) {
            newMoveCoordinate.x2 = (m - nBottom) / (bBottom - a);
            newMoveCoordinate.y2 = a * newMoveCoordinate.x2 + m;
        }
		
        //check top
        var bTop = 0;
        var nTop = 2 * r;
        if (bTop != a && first) {
            newMoveCoordinate.x1 = (m - nTop) / (bTop - a);
            newMoveCoordinate.y1 = a * newMoveCoordinate.x1 + m;
            first = false;
        } else if (bTop != a) {
            newMoveCoordinate.x2 = (m - nTop) / (bTop - a);
            newMoveCoordinate.y2 = a * newMoveCoordinate.x2 + m;
        }

        var distance = {
            d1: Math.sqrt(Math.pow(line.centerX() - newMoveCoordinate.x1, 2) + Math.pow(line.centerY() - newMoveCoordinate.y1, 2)),
            d2: Math.sqrt(Math.pow(line.centerX() - newMoveCoordinate.x2, 2) + Math.pow(line.centerY() - newMoveCoordinate.y2, 2))
        };

        var newX = line.centerX() + line.getNormVector.x;
        var newY = line.centerY() + line.getNormVector.y;
        var newDistance = {
            d1: Math.sqrt(Math.pow(newX - newMoveCoordinate.x1, 2) + Math.pow(newY - newMoveCoordinate.y1, 2)),
            d2: Math.sqrt(Math.pow(newX - newMoveCoordinate.x2, 2) + Math.pow(newY - newMoveCoordinate.y2, 2))
        }

        if (distance.d1 < newDistance.d1) {
            return { x: newMoveCoordinate.x1, y: newMoveCoordinate.y1 };
        } else {
            return { x: newMoveCoordinate.x2, y: newMoveCoordinate.y2 };
        }
    }
	
    //
    function getNewMoveVector(line, vectorLength) {
        var linesInOrbit = getLinesInOrbit(line, vectorLength * 4);
        var vector = {
            x: 0,
            y: 0
        };
        for (var i = 0; i < linesInOrbit.length; i++) {
            vector.x += linesInOrbit[i].getNormVector().x;
            vector.y += linesInOrbit[i].getNormVector().y;
        }
        vector.x = vector.x / linesInOrbit.length;
        vector.y = vector.y / linesInOrbit.length;
        return vector;
    }
	
    //Gibt ein Array von Lines zurück die in einem Orbit um einen Punkt existieren
    function getLinesInOrbit(line, orbit) {
        var orbitLines = [];
        for (var i = 0; i < lines.length; i++) {
            var distance = Math.sqrt(Math.pow(line.centerX() - lines[i].centerX(), 2) + Math.pow(line.centerY() - lines[i].centerY(), 2));
            if (distance <= orbit) {
                orbitLines.push(lines[i]);
            }
        }
        return orbitLines;
    }

    //Berechnung der Anziehungskräfte zwischen den Linien
    function computeForcesLines() {
        var i, j;
        var p;

        for (i = 0; i < lines.length; i++) {
            p = lines[i].center;
            p.fx = 0;
            p.fy = 0;
        }
        for (i = 0; i < lines.length; i++) {
            var p1 = lines[i].center;
            for (j = i + 1; j < lines.length; j++) {
                var p2 = lines[j].center;

                // F = G * m1 * m2 / (r^2) // kein var F ??
                //var d= (p1.centerX()-p2.centerX())*(p1.centerX()-p2.centerX())+(p1.centerY()-p2.centerY())*(p1.centerY()-p2.centerY());
                var d = Math.sqrt(Math.pow((p1.centerX() - p2.centerX()), 2) + Math.pow((p1.centerY() - p2.centerY()), 2));
                //var F= 0.4 * p1.mass * p2.mass / d ;
                var F = 0.4 * p1.mass * p2.mass * 0.000001;
				
                // compute vector pointing from particle 1 -> 2
                var dx = p2.centerX() - p1.centerX();
                var dy = p2.centerY() - p1.centerY();

                // accumulate forces on each particle
                p1.fx += F * dx;
                p1.fy += F * dy;
                p2.fx -= F * dx;
                p2.fy -= F * dy;
            }
        }
    }

    //Berechnung Anziehungskraft zwischen den Linien und einer Gravitationsquelle
    function computeForces() {
        var i, j;
        var p;

        for (i = 0; i < lines.length; i++) {
            p = lines[i].center;
            p.fx = 0;
            p.fy = 0;
        }

        for (i = 0; i < lines.length; i++) {
            var line = lines[i];

            // F = G * m1 * m2 / (r^2)
            //var d= (line.center.centerX()-gravitationSource.centerX)*(line.center.centerX()-gravitationSource.centerX)+(line.center.centerY()-gravitationSource.centerY)*(line.center.centerY()-gravitationSource.centerY);
            var d = Math.sqrt(Math.pow((line.center.centerX() - gravitationSource.centerX), 2) + Math.pow((line.center.centerY() - gravitationSource.centerY), 2));
            var F = 0.8 * line.center.mass * gravitationSource.mass * 0.00001;

            if (line.center.oldDistance && line.center.oldDistance <= d) {
                F = F * 14;
            }

            if (Math.abs(d) <= 50) {
                F = F * -1;
            }

            // compute vector pointing from particle 1 -> 2
            var dx = gravitationSource.centerX - line.center.centerX();
            var dy = gravitationSource.centerY - line.center.centerY();

            // accumulate forces on each particle
            line.center.fx += F * dx;
            line.center.fy += F * dy;
            line.center.oldDistance = d;
        }
    }

    //neu
    function integrateAccelerations() {

        // integrate acceleration down to velocity and positions
        for (i = 0; i < lines.length; i++) {
            var line = lines[i];
            var p = lines[i].center;
            var ax = p.fx / p.mass; // acceleration, according to F=ma
            var ay = p.fy / p.mass;
            p.vx += ax;
            p.vy += ay;
            line.moveX += p.vx * 0.05;
            line.moveY += p.vy * 0.05;
            if (line.moveX > canvas.width) {
                line.moveX = canvas.width;
            }
            if (line.moveX < 0) {
                line.moveX = 0;
            }
            if (line.moveY > canvas.height) {
                line.moveY = canvas.height;
            }
            if (line.moveY < 0) {
                line.moveY = 0;
            }
            /*line.x += p.vx;
            line.x1 += p.vx;
            line.y += p.vy;
            line.y1 += p.vy;*/
        }
    }


} (window.lineapp = window.lineapp || {}));