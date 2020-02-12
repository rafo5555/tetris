const tetris = {

    __init: function(){
        this.__initEvents();
        this.__initProperties();
    },
    __initProperties: function(){
        this.tetY = 20;
        this.tetX = 15;
        this.nextFigWrapX = 4;
        this.nextFigWrapY = 4;
        this.squireSize = 40;
        this.tetFieldHeight = this.tetY * this.squireSize;
        this.tetFieldWidth = this.tetX * this.squireSize;
        this.tetrisArray = [...new Array(this.tetY)].map(e => new Array(this.tetX).fill(0));
        this.tetArrCopy = this.copyTetrisArray();
        this.wrapArr = [...new Array(this.nextFigWrapY)].map(e => new Array(this.nextFigWrapX).fill(0));
        this.figures = this.getFigures();
        this.currentFigure = this.getRandomFigure();
        this.nextFigure = this.getRandomFigure();
        this.startX = Math.floor(this.tetX / 2) - 1;
        this.startY = 0;
        this.figureColors  = ['white','purple','cyan','blue','yellow','orange','green','red'];
        this.gameStatus = 'stopped';
        this.score = 0;
        this.level = 1;
        this.interval = null;
        this.levels = {
            1: 1000,
            2: 950,
            3: 900,
            4: 850,
            5: 800,
            6: 750,
            7: 700,
            8: 650
        };
    },
    __initEvents: function(){
        const that = this;
        document.addEventListener('DOMContentLoaded', function(){
            let tetrisField = that.createTetrisField();
            that.appendSquares(tetrisField, that.tetrisArray);
            that.createInfoField(tetrisField);
            document.getElementById('select-level').addEventListener('change', function(){
                if(document.getElementById('start-stop-game').getAttribute('data-status') == 'stopped'){
                    that.level = +this.value;
                    document.getElementById('level-value').innerHTML = this.value;
                }
            });
            document.getElementById('play-pause-btn').addEventListener('click', function(){
                if(document.getElementById('start-stop-game').getAttribute('data-status') == 'playing'){
                    const status = this.getAttribute('data-status');
                    if(status == 'playing'){
                        that.gameStatus = 'paused';
                        this.innerHTML = 'Play';
                        clearInterval(that.interval);
                    }else{
                        that.gameStatus = 'playing';
                        this.innerHTML = 'Pause';
                        that.interval = setInterval(() => {
                            that.moveDown();
                        }, that.duration);
                    }
                    this.setAttribute('data-status',that.gameStatus);
                }
            });
            document.getElementById('start-stop-game').addEventListener('click', function(e){
                const status = this.getAttribute('data-status');
                if(status == 'stopped'){
                        that.gameStatus = 'playing';
                        this.innerHTML = 'Stop';
                        that.placeFigure();
                        that.placeNextFigure({startX: 1, startY: 0});
                        that.duration = that.levels[that.level];
                        that.interval = setInterval(() => {
                            that.moveDown();
                        }, that.duration);
                        document.getElementById('select-level').setAttribute('disabled',true);
                }else{
                        that.gameStatus = 'stopped';
                        this.innerHTML = 'Start';
                        that.clearTetris();
                        document.getElementById('select-level').removeAttribute('disabled');
                        document.querySelector('#select-level > option:first-child').setAttribute('selected',true);
                }
                this.setAttribute('data-status',that.gameStatus);
            });
        });  
        document.addEventListener('keydown', function(e){
            if(that.gameStatus === 'playing'){
                if(e.keyCode === 37){
                    that.moveFigureHorizontally('left', -1);
                }else if(e.keyCode === 39){
                    that.moveFigureHorizontally('right', 1);
                }else if(e.keyCode === 40){
                    that.moveDown();
                }else if(e.keyCode === 38){
                    that.deleteFigure();
                    that.currentFigure = that.rotateFigure(that.currentFigure);
                    that.placeFigure();
                }
            }
        });
        document.addEventListener('figure-stoped', function(e){
            that.checkRows();
            that.tetArrCopy = that.copyTetrisArray();
            that.currentFigure = that.nextFigure;
            that.nextFigure = that.getRandomFigure();
            that.startY = 0;
            that.startX = Math.floor(that.tetX / 2) -1;
            that.placeFigure();
            that.clearGameField('#next-figure-wrapper > .tetris-square',{x: that.nextFigWrapX, y: that.nextFigWrapY},'nextField');
            that.placeNextFigure({startX: 1, startY: 0});
        });
    },
    moveFigureHorizontally: function(direction, number){
        if(!this.checkCollision(direction)){
            this.deleteFigure();
            this.startX += number;
            this.placeFigure();
        }    
    },
    moveDown: function(){
        if(!this.checkCollision('down')){
            this.deleteFigure();
            this.startY++;
            this.placeFigure();
        }
    },
    clearTetris: function(){
        this.clearGameField('#tetris-field > .tetris-square',{x: this.tetX, y: this.tetY});
        this.clearGameField('#next-figure-wrapper > .tetris-square',{x: this.nextFigWrapX, y: this.nextFigWrapY},'nextField');
        this.tetArrCopy = this.copyTetrisArray();
        this.score = 0;
        this.level = 1;
        this.startY = 0;
        this.startX = Math.floor(this.tetX / 2) - 1;
        document.getElementById('score-value').innerHTML = this.score;
        document.getElementById('level-value').innerHTML = this.level;
        clearInterval(this.interval);
    },
    checkRows: function(){
        for (let y = 0; y < this.tetrisArray.length; ++y) {
            let isCompleted = true;
            for (let x = 0; x < this.tetrisArray[y].length; ++x) {
                if(this.tetrisArray[y][x] == 0){
                    isCompleted = false;
                    break;
                }
            }
            if(isCompleted){
                this.score += (10 * this.level);
                document.getElementById('score-value').innerHTML = this.score;
                this.tetrisArray.splice(y,1);
                this.tetrisArray.unshift(new Array(this.tetX).fill(0));
                this.appendSquares(document.getElementById('tetris-field'), this.tetrisArray);
            }
        }
    },
    checkCollision: function(direction, figure = this.currentFigure){
        const arrLength = figure.length;
        for(let y = 0; y < arrLength; ++y){
            for (let x = 0; x < figure[y].length; ++x) {
                if(figure[y][x] > 0){
                    if(direction == 'down' && (!this.tetArrCopy[this.startY + y + 1] || this.tetArrCopy[this.startY + y + 1][this.startX + x] > 0)){
                        document.dispatchEvent(new CustomEvent('figure-stoped'));
                        return true;
                    }else if(direction == 'left' && (this.startX <= 0 || this.tetArrCopy[this.startY + y][this.startX - 1] > 0)){
                        return true;
                    }else if(direction == 'right' && (this.startX >= this.tetX - figure[0].length || this.tetArrCopy[this.startY + y][this.startX + x + 1] > 0)){
                        return true;
                    }else if(direction == 'rotate' && (this.tetArrCopy[this.startY + y][this.startX + x + 1] > 0 || this.tetArrCopy[this.startY + y][this.startX - 1] > 0)){
                        return true;
                    }
                }
            }
        }
        return false;
    },
    createTetrisField: function(){
        const tetWrapper = document.getElementById('tetris');
        const tetrisField = document.createElement('div');
        tetrisField.id = 'tetris-field';
        tetrisField.style.width = this.tetFieldWidth + 'px';
        tetrisField.style.height = this.tetFieldHeight + 'px';
        tetWrapper.append(tetrisField);
        return tetrisField;
    },
    copyTetrisArray: function(){
       const coppiedArr = [];
        for (let i = 0; i < this.tetrisArray.length; ++i) {
            coppiedArr.push([...this.tetrisArray[i]]);
        }
        return coppiedArr;
    },
    createInfoField: function(siblingElement){
        const element = document.createElement('div');
        const heading = document.createElement('h2');
        const btnWrapper = document.createElement('div');
        const startStopBtn = document.createElement('button');
        const playPauseBtn = document.createElement('button');
        const nextFigureWrapper = document.createElement('div');
        const textWrapper = document.createElement('div');
        const scoreWrapper = document.createElement('div');
        const scoreValue = document.createElement('span');
        const levelWrapper = document.createElement('div');
        const levelValue = document.createElement('span');
        const selectHeading = document.createElement('h6');
        let selectLevel = document.createElement('select');
        element.id = 'tetris-info';
        element.style.height = this.tetFieldHeight + 'px';
        heading.innerText = 'TETRIS';
        heading.className = 'info-heading';
        btnWrapper.className = 'btn-wrapper';
        startStopBtn.id = 'start-stop-game';
        startStopBtn.setAttribute('data-status',this.gameStatus);
        startStopBtn.className = 'btn';
        startStopBtn.innerText = 'Start';
        playPauseBtn.id = 'play-pause-btn';
        playPauseBtn.className = 'btn';
        playPauseBtn.innerText = 'Pause';
        playPauseBtn.setAttribute('data-status','playing');
        btnWrapper.append(startStopBtn);
        btnWrapper.append(playPauseBtn);
        nextFigureWrapper.id = 'next-figure-wrapper';
        nextFigureWrapper.style.width = this.nextFigWrapX * this.squireSize + 'px';
        nextFigureWrapper.style.height = this.nextFigWrapY * this.squireSize + 'px';
        this.appendSquares(nextFigureWrapper, this.wrapArr);
        textWrapper.className = 'text-wrapper';
        scoreWrapper.innerHTML = 'Score: ';
        levelWrapper.innerHTML = 'Level: ';
        scoreValue.innerHTML = this.score;
        levelValue.innerHTML = this.level;
        scoreValue.id = 'score-value';
        levelValue.id = 'level-value';
        scoreWrapper.append(scoreValue);
        selectHeading.innerHTML = 'Select Level';
        selectHeading.style.margin = '10px';
        levelWrapper.append(levelValue);
        selectLevel.id = 'select-level';
        selectLevel = this.appendOptions(selectLevel);
        textWrapper.append(scoreWrapper);
        textWrapper.append(levelWrapper);
        textWrapper.append(selectHeading);
        textWrapper.append(selectLevel);
        element.append(heading);
        element.append(btnWrapper);
        element.append(nextFigureWrapper);
        element.append(textWrapper);
        siblingElement.after(element);
    },
    appendOptions: function(selectLevel){
        for(let key in this.levels){
            let option = document.createElement('option');
            option.value = key;
            option.innerHTML = 'Level ' + key;
            selectLevel.append(option);
        }
        return selectLevel;
    },
    appendSquares: function(tetrisField, tetrisArray){
        tetrisField.innerHTML = '';
        for(let y = 0; y < tetrisArray.length; ++y){
            for(let x = 0; x < tetrisArray[y].length; ++x){
                let square = document.createElement('div');
                square.id = `t_${y}_${x}`;
                square.className = 'tetris-square';
                square.style.width = `${this.squireSize}px`;
                square.style.height = `${this.squireSize}px`;
                square.style.backgroundColor = this.figureColors[tetrisArray[y][x]];
                tetrisField.append(square);
            }
        }
    },
    getFigures: function(){
        return {
            1: [
                [0, 1],
                [1, 1],
                [0, 1]
            ],
            2: [
                [2, 0],
                [2, 0],
                [2, 2]
            ],
            3: [
                [0, 3],
                [0, 3],
                [3, 3]
            ],
            4: [
                [4, 0],
                [4, 4],
                [0, 4]
            ],
            5: [
                [5, 5],
                [5, 5]
            ],
            6: [
                [0, 6],
                [6, 6],
                [6, 0]
            ],
            7: [
                [7],
                [7],
                [7],
                [7]
            ]
        };
    },
    getRandomFigure: function(){
        const randomNumber = Math.ceil(Math.random() * 7);
        return this.figures[randomNumber];
    },
    rotateFigure: function (figure){
        const rotatedFigure = [];
        const arrLength = figure[0].length;

        if(this.tetY - arrLength - 1 < this.startY){
            return figure;
        }
        if(this.tetX - arrLength <= this.startX && figure.length > arrLength){
            this.startX -= figure.length - arrLength;
        }else if(arrLength == 1 && this.tetX - figure.length <= this.startX){
            this.startX = this.tetX - figure.length <= this.startX ? this.tetX - figure.length : this.startX;
        }
        for(let i = 0; i < arrLength; i++){
            for(let j = figure.length - 1; j >= 0; j--){
                if(!Array.isArray(rotatedFigure[i])){rotatedFigure[i] = []}
                rotatedFigure[i].push(figure[j][i])
            }
        }
        if(this.checkCollision('rotate',rotatedFigure)){
            return figure;
        }
        return rotatedFigure;
    },
    placeFigure: function(){
        const arrLength = this.currentFigure.length;
        for(let y = 0; y < arrLength; ++y){
            for (let x = 0; x < this.currentFigure[y].length; ++x) {
                if(this.currentFigure[y][x] > 0){
                    let value = this.currentFigure[y][x];
                    this.tetrisArray[y + this.startY][x + this.startX] = value;
                    document.querySelector(`#tetris-field > #t_${y + this.startY}_${x + this.startX}`).style.backgroundColor = this.figureColors[value];
                }
            }
        }    
    },
    placeNextFigure: function({startX, startY}){
        const arrLength = this.nextFigure.length;
        for(let y = 0; y < arrLength; ++y){
            for (let x = 0; x < this.nextFigure[y].length; ++x) {
                if(this.nextFigure[y][x] > 0){
                    let value = this.nextFigure[y][x];
                    this.wrapArr[y + startY][x + startX] = value;
                    document.querySelector(`#next-figure-wrapper > #t_${y + startY}_${x + startX}`).style.backgroundColor = this.figureColors[value];
                }
            }
        }
    },
    deleteFigure: function(){
        for(let y = 0; y < this.currentFigure.length; ++y){
            for (let x = 0; x < this.currentFigure[y].length; ++x) {
                if(this.currentFigure[y][x] > 0){
                    this.tetrisArray[y + this.startY][x + this.startX] = 0;
                    document.querySelector(`#t_${y + this.startY}_${x + this.startX}`).style.backgroundColor = 'white';
                }
            }
        }
    },
    clearGameField: function(selector,{x,y},gameField = 'tetris-field'){
        if(gameField == 'tetris-field'){
            this.tetrisArray = [...new Array(y)].map(e => new Array(x).fill(0));
        }else{
            this.wrapArr = [...new Array(y)].map(e => new Array(x).fill(0));
        }
        let squares = document.querySelectorAll(selector);
        for(let square of squares){
            square.style.backgroundColor = 'white';
        }
    }
};

tetris.__init();

