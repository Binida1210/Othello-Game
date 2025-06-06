// This file contains the JavaScript code that implements the game logic for Othello.
// It manages the game state, handles user interactions, and updates the UI based on player actions.

document.addEventListener("DOMContentLoaded", () => {
    let boardSize = 8;
    let blockCount = 0;
    let board = [];
    let currentPlayer = 1; // 1: Black, 2: White
    let settingFirst = 1;
    let lastMove = null;
    let history = [];
    let future = [];
    let mode = "pvp";
    let aiLevel = "random";
    let aiPlayer = 2; // 1: Black, 2: White

    const settings = document.getElementById("settings");
    const game = document.getElementById("game");
    const boardSizeInput = document.getElementById("boardSize");
    const boardSizeVal = document.getElementById("boardSizeVal");
    const blockCountInput = document.getElementById("blockCount");
    const blockCountVal = document.getElementById("blockCountVal");
    const blackFirstBtn = document.getElementById("blackFirst");
    const whiteFirstBtn = document.getElementById("whiteFirst");
    const randomFirstBtn = document.getElementById("randomFirst");
    const okBtn = document.getElementById("okBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const backMenuBtn = document.getElementById("backMenuBtn");
    const modeSelect = document.getElementById("mode");
    const aiRow = document.getElementById("aiRow");
    const aiLevelSelect = document.getElementById("aiLevel");
    const statusDiv = document.getElementById("status");

    modeSelect.onchange = function () {
        mode = this.value;
        aiRow.style.display = mode === "pve" ? "" : "none";
    };

    boardSizeInput.oninput = function () {
        let v = parseInt(this.value);
        if (v % 2 !== 0) v += 1;
        this.value = v;
        boardSizeVal.textContent = v;
        blockCountInput.max = Math.floor((v * v) / 2 - 4);
        if (parseInt(blockCountInput.value) > blockCountInput.max) {
            blockCountInput.value = blockCountInput.max;
            blockCountVal.textContent = blockCountInput.max;
        }
    };

    blockCountInput.oninput = function () {
        blockCountVal.textContent = this.value;
    };

    blackFirstBtn.onclick = () => setFirstPlayer(1);
    whiteFirstBtn.onclick = () => setFirstPlayer(2);
    randomFirstBtn.onclick = () => setFirstPlayer(Math.random() < 0.5 ? 1 : 2);

    okBtn.onclick = function () {
        boardSize = parseInt(boardSizeInput.value);
        blockCount = parseInt(blockCountInput.value);
        currentPlayer = settingFirst;
        mode = modeSelect.value;
        aiLevel = aiLevelSelect.value;
        aiPlayer = mode === "pve" && settingFirst === 2 ? 1 : 2;
        startGame();
        settings.style.display = "none";
        game.style.display = "";
    };

    cancelBtn.onclick = function () {
        window.close();
    };

    backMenuBtn.onclick = function () {
        game.style.display = "none";
        settings.style.display = "";
    };

    function setFirstPlayer(player) {
        settingFirst = player;
        blackFirstBtn.classList.toggle("selected", player === 1);
        whiteFirstBtn.classList.toggle("selected", player === 2);
        randomFirstBtn.classList.toggle("selected", player === 3);
    }

    function saveHistory() {
        history.push({
            board: JSON.parse(JSON.stringify(board)),
            currentPlayer,
            lastMove: lastMove ? [...lastMove] : null,
        });
        if (history.length > 100) history.shift();
        future = [];
    }

    function undo() {
        if (history.length > 1) {
            future.push(history.pop());
            let prev = history[history.length - 1];
            board = JSON.parse(JSON.stringify(prev.board));
            currentPlayer = prev.currentPlayer;
            lastMove = prev.lastMove ? [...prev.lastMove] : null;
            renderBoard();
            updateInfo();
            statusDiv.textContent = "";
        }
    }

    function redo() {
        if (future.length > 0) {
            let next = future.pop();
            history.push(next);
            board = JSON.parse(JSON.stringify(next.board));
            currentPlayer = next.currentPlayer;
            lastMove = next.lastMove ? [...next.lastMove] : null;
            renderBoard();
            updateInfo();
            statusDiv.textContent = "";
        }
    }

    document.getElementById("undoBtn").onclick = undo;
    document.getElementById("redoBtn").onclick = redo;

    function startGame() {
        board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
        let mid = boardSize / 2;
        board[mid - 1][mid - 1] = 2;
        board[mid][mid] = 2;
        board[mid - 1][mid] = 1;
        board[mid][mid - 1] = 1;

        let used = new Set([`${mid - 1},${mid - 1}`, `${mid},${mid}`, `${mid - 1},${mid}`, `${mid},${mid - 1}`]);
        let placed = 0;
        while (placed < blockCount) {
            let r = Math.floor(Math.random() * boardSize);
            let c = Math.floor(Math.random() * boardSize);
            if (board[r][c] === 0 && !used.has(`${r},${c}`)) {
                board[r][c] = 3;
                used.add(`${r},${c}`);
                placed++;
            }
        }
        lastMove = null;
        renderBoard();
        updateInfo();
        history = [];
        future = [];
        saveHistory();
        statusDiv.textContent = "";
        if (mode === "pve" && currentPlayer === aiPlayer) {
            setTimeout(aiMove, 400);
        }
    }

    function renderBoard() {
        const boardDiv = document.getElementById("board");
        boardDiv.innerHTML = "";
        boardDiv.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
        boardDiv.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
        for (let r = 0; r < boardSize; ++r) {
            for (let c = 0; c < boardSize; ++c) {
                const cell = document.createElement("div");
                cell.className = "cell";
                if (isValidMove(r, c, currentPlayer) && (mode === "pvp" || currentPlayer !== aiPlayer)) {
                    cell.classList.add("highlight");
                }
                if (lastMove && lastMove[0] === r && lastMove[1] === c) {
                    cell.classList.add("last-move");
                }
                if (board[r][c] === 1) {
                    const disc = document.createElement("div");
                    disc.className = "disc black";
                    cell.appendChild(disc);
                } else if (board[r][c] === 2) {
                    const disc = document.createElement("div");
                    disc.className = "disc white";
                    cell.appendChild(disc);
                } else if (board[r][c] === 3) {
                    const block = document.createElement("div");
                    block.className = "block-square";
                    cell.appendChild(block);
                }
                cell.onclick = function () {
                    if (mode === "pve" && currentPlayer === aiPlayer) return;
                    if (isValidMove(r, c, currentPlayer)) {
                        makeMove(r, c, currentPlayer);
                        lastMove = [r, c];
                        renderBoard();
                        updateInfo();
                        setTimeout(checkGameOver, 100);
                        if (mode === "pve" && currentPlayer === aiPlayer && hasValidMove(aiPlayer)) {
                            setTimeout(aiMove, 500);
                        }
                    }
                };
                boardDiv.appendChild(cell);
            }
        }
    }

    function isValidMove(row, col, player) {
        if (board[row][col] !== 0) return false;
        let opponent = player === 1 ? 2 : 1;
        let dr = [-1, -1, -1, 0, 0, 1, 1, 1],
            dc = [-1, 0, 1, -1, 1, -1, 0, 1];
        for (let d = 0; d < 8; ++d) {
            let r = row + dr[d],
                c = col + dc[d],
                cnt = 0;
            while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === opponent) {
                r += dr[d];
                c += dc[d];
                ++cnt;
            }
            if (cnt > 0 && r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === player) {
                let rr = row + dr[d],
                    cc = col + dc[d],
                    blockFound = false;
                for (let i = 0; i < cnt; ++i) {
                    if (board[rr][cc] === 3) {
                        blockFound = true;
                        break;
                    }
                    rr += dr[d];
                    cc += dc[d];
                }
                if (!blockFound) return true;
            }
        }
        return false;
    }

    function makeMove(row, col, player) {
        board[row][col] = player;
        flipDiscs(row, col, player);
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        saveHistory();
        if (!hasValidMove(currentPlayer)) {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            if (!hasValidMove(currentPlayer)) {
                setTimeout(showGameOver, 200);
            } else if (mode === "pve" && currentPlayer === aiPlayer) {
                statusDiv.textContent = "Opponent has no valid move. AI turn!";
                setTimeout(aiMove, 700);
            } else {
                statusDiv.textContent = "Opponent has no valid move. Your turn!";
            }
        } else {
            statusDiv.textContent = "";
        }
    }

    function flipDiscs(row, col, player) {
        let opponent = player === 1 ? 2 : 1;
        let dr = [-1, -1, -1, 0, 0, 1, 1, 1],
            dc = [-1, 0, 1, -1, 1, -1, 0, 1];
        for (let d = 0; d < 8; ++d) {
            let r = row + dr[d],
                c = col + dc[d],
                cnt = 0;
            while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === opponent) {
                r += dr[d];
                c += dc[d];
                ++cnt;
            }
            if (cnt > 0 && r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === player) {
                let rr = row + dr[d],
                    cc = col + dc[d];
                for (let i = 0; i < cnt; ++i) {
                    board[rr][cc] = player;
                    rr += dr[d];
                    cc += dc[d];
                }
            }
        }
    }

    function hasValidMove(player) {
        for (let r = 0; r < boardSize; ++r)
            for (let c = 0; c < boardSize; ++c)
                if (isValidMove(r, c, player)) return true;
        return false;
    }

    function countDiscs(player) {
        let cnt = 0;
        for (let r = 0; r < boardSize; ++r)
            for (let c = 0; c < boardSize; ++c) if (board[r][c] === player) ++cnt;
        return cnt;
    }

    function updateInfo() {
        document.getElementById("turn").textContent = "Turn: " + (currentPlayer === 1 ? "Black" : "White");
        document.getElementById("score").innerHTML = "Black: " + countDiscs(1) + "<br>White: " + countDiscs(2);
    }

    function showGameOver() {
        let black = countDiscs(1),
            white = countDiscs(2);
        let msg = black > white ? "Black wins!" : white > black ? "White wins!" : "Draw!";
        statusDiv.textContent = "";
        if (confirm(`Black: ${black}\nWhite: ${white}\n${msg}\n\nNew Game?`)) {
            game.style.display = "none";
            settings.style.display = "";
        }
    }

    function checkGameOver() {
        if (!hasValidMove(1) && !hasValidMove(2)) showGameOver();
    }

    function aiMove() {
        if (mode !== "pve" || currentPlayer !== aiPlayer) return;
        let moves = [];
        for (let r = 0; r < boardSize; ++r)
            for (let c = 0; c < boardSize; ++c)
                if (isValidMove(r, c, aiPlayer)) moves.push([r, c]);
        if (moves.length === 0) return;
        let move;
        if (aiLevel === "random") {
            move = moves[Math.floor(Math.random() * moves.length)];
        } else if (aiLevel === "greedy") {
            let maxFlip = -1;
            for (let m of moves) {
                let flips = countFlips(m[0], m[1], aiPlayer);
                if (flips > maxFlip) {
                    maxFlip = flips;
                    move = m;
                }
            }
        }
        if (move) {
            makeMove(move[0], move[1], aiPlayer);
            lastMove = [move[0], move[1]];
            renderBoard();
            updateInfo();
            setTimeout(checkGameOver, 100);
        }
    }

    function countFlips(row, col, player) {
        let opponent = player === 1 ? 2 : 1;
        let dr = [-1, -1, -1, 0, 0, 1, 1, 1],
            dc = [-1, 0, 1, -1, 1, -1, 0, 1];
        let total = 0;
        for (let d = 0; d < 8; ++d) {
            let r = row + dr[d],
                c = col + dc[d],
                cnt = 0;
            while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === opponent) {
                r += dr[d];
                c += dc[d];
                ++cnt;
            }
            if (cnt > 0 && r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === player) {
                let rr = row + dr[d],
                    cc = col + dc[d],
                    blockFound = false;
                for (let i = 0; i < cnt; ++i) {
                    if (board[rr][cc] === 3) {
                        blockFound = true;
                        break;
                    }
                    rr += dr[d];
                    cc += dc[d];
                }
                if (!blockFound) total += cnt;
            }
        }
        return total;
    }
});