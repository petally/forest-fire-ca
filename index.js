// Davids Levs Zvirgzds
// Forest fire cellular automaton
const COLUMNS = 128;
const ROWS = 128; 
const CELL_SIZE = 5;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = COLUMNS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

let mousePos = { x: 0, y: 0 };

let data = []; // Total amount of vegetation / vegetation density / amount of ignited cells 
// {generation: 0, totalVeg: 0, vegDensity: 0, ignitedCells: 0}

// 2D array helpers
const makeGrid = () => Array.from({ length: ROWS }, () => Array.from({ length: COLUMNS }, () => ({ vegetation: 0, ignited: false }) ));
let grid = makeGrid();
let next = makeGrid();

// counts all surrounding cells from the given position
function countIgnitedNeighbors(grid, row, column, type) {
  let n = 0;
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      let r = grid[row + dr];
      if (!r) continue;
      let cell = r[column + dc];
      if (!cell) continue;
      if (!cell.ignited) continue;
    //   const nr = (row + dr + ROWS) % ROWS;
    //   const nc = (column + dc + COLUMNS) % COLUMNS;
    //   if (!grid[nr][nc].ignited) continue;
      n += 1;
    }
  return n;
}

let insertCurrentGenerationData = () => {
  let totalVeg = 0;
  let vegDensity = 0;
  let ignitedCells = 0;
  let ignitedVeg = 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      if (grid[r][c].ignited) {
        ignitedCells += 1;
        ignitedVeg += grid[r][c].vegetation;
      }

      totalVeg += grid[r][c].vegetation;
    }
  }

  vegDensity = totalVeg / (ROWS * COLUMNS);
  fireDensity = ignitedVeg / (ROWS * COLUMNS);
  data[current_steps] = {generation: current_steps, totalVeg: totalVeg, vegDensity: vegDensity, ignitedCells: ignitedCells, fireDensity: fireDensity};
};

let current_steps = 0;
function step() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      // if fire, delete self
      if (grid[r][c].ignited) {
        if (grid[r][c].vegetation <= 0) {
            next[r][c].vegetation = 0
            next[r][c].ignited = false
        } else {
            next[r][c].vegetation = grid[r][c].vegetation - 1;
            next[r][c].ignited = (Math.random() * 10 < 0.1) ? false : true; // low random chance to deignite
        }
        continue;
      }
      // if vegetation, spread fire
      if (grid[r][c].vegetation > 0) {
        const surroundingFireAmount = countIgnitedNeighbors(grid, r, c);
        // Random chance calculation
        next[r][c].ignited = (surroundingFireAmount > Math.random() * 50) ? true : false;
        next[r][c].vegetation = grid[r][c].vegetation;
        continue;
      }
      next[r][c] = grid[r][c];
    }
  }
  [grid, next] = [next, grid];
  insertCurrentGenerationData();
  current_steps += 1;
}

let displayingValues = false;
const valueDisplayButton = document.getElementById('value-display-button');
valueDisplayButton.addEventListener('click', e => {
    e.preventDefault();
    displayingValues = !displayingValues;
    if (displayingValues) {
        valueDisplayButton.innerText = 'Disable value display';
    } else {
        valueDisplayButton.innerText = 'Enable value display';
    }
});

const stepsDisplay = document.getElementById('current-steps');
function draw() {
  ctx.fillStyle = "rgb(82, 41, 19)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      if (grid[r][c].vegetation > 0) {
        ctx.fillStyle = `rgb(
          0,
          ${255 - Math.min(grid[r][c].vegetation, 200)},
          0
        )`;
      } else {
        ctx.fillStyle = "rgb(82, 41, 19)";
      }

      if (grid[r][c].ignited) {
        ctx.fillStyle = "red";
      } 
      
      ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      if (displayingValues) {
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "blue";
        ctx.fillText(grid[r][c].vegetation, c * CELL_SIZE, r * CELL_SIZE);
      }
    }
  }

  // draw current steps
  stepsDisplay.innerText = "Generation: " + current_steps
}

// limit to 30 fps
let last = 0;
function loop(ts) {
  handlePaint();
  if (ts - last >= 1000 / 30) {
    if (!paused) step();
    draw();
    last = ts;
  }
  requestAnimationFrame(loop);
}

// reset fundamental sim data
let resetState = () => {
  paused = true;
  pauseButton.innerText = paused ? 'Unpause simulation' : 'Pause simulation';
  current_steps = 0;
  data = [];
};

// place / erase cells
let placing = 1; // 2 = fire, 1 = placing, 0 = removing
let painting = false; // whether the mouse is down
const modeDisplay = document.querySelector('#current-mode');
const placeModeButton = document.querySelector('#place-mode');
placeModeButton.addEventListener('click', e => {
    placing = 1;
    modeDisplay.innerText = 'Mode: placing';
});
const eraseModeButton = document.querySelector('#erase-mode');
eraseModeButton.addEventListener('click', e => {
    placing = 0;
    modeDisplay.innerText = 'Mode: erasing';
});
const fireModeButton = document.querySelector('#fire-mode');
fireModeButton.addEventListener('click', e => {
    placing = 2;
    modeDisplay.innerText = 'Mode: placing fire';
});

let updateMousePos = (e) => {
  const c = Math.floor(e.offsetX / CELL_SIZE);
  const r = Math.floor(e.offsetY / CELL_SIZE);
  mousePos = {x: c, y: r};
};

let handlePaint = () => {
  if (!painting) { return; }
  if (!grid[mousePos.y] || !grid[mousePos.y][mousePos.x]) { return; }
  if (placing == 1) {
    grid[mousePos.y][mousePos.x].vegetation += 10
  } else if (placing == 0) {
    grid[mousePos.y][mousePos.x].vegetation -= 10
  } else {
    grid[mousePos.y][mousePos.x].ignited = true
  }
  // Ensure a minimum value (0)
  grid[mousePos.y][mousePos.x].vegetation = Math.max(grid[mousePos.y][mousePos.x].vegetation, 0);
};

canvas.addEventListener('mousedown', e => {
  painting = true;
  updateMousePos(e);
});
canvas.addEventListener('mousemove', e => {
  if (!painting) { return; }
  updateMousePos(e);
});
canvas.addEventListener('mouseup', e => {
    painting = false;
});

// pause & advance buttons
let paused = false;
const pauseButton = document.querySelector('#pause-button');
pauseButton.addEventListener('click', e => {
  e.preventDefault(); 
  paused = !paused;
  pauseButton.innerText = paused ? 'Unpause simulation' : 'Pause simulation';
});

const advanceButton = document.querySelector('#advance-button');
advanceButton.addEventListener('click', e => {
    e.preventDefault();
    step();
    draw();
});

const fillScreenButton = document.querySelector('#fill-screen-button');
fillScreenButton.addEventListener('click', e => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      grid[r][c].vegetation = 50 + Math.random() * 50;
    }
  }

  resetState();
});

const genWorldButton = document.querySelector('#gen-world-button');
genWorldButton.addEventListener('click', e => {
  e.preventDefault();

  noise.seed(Math.random());
  let densityBias = (Math.random() * 2) - 0.75;
  for (var x = 0; x < COLUMNS; x++) {
    for (var y = 0; y < ROWS; y++) {
      let value = noise.simplex2(x / 10, y / 10);
      grid[y][x].vegetation = (value + densityBias) * 100;
      if (grid[y][x].vegetation < 0) {
        grid[y][x].vegetation = 0;
      } 
      grid[y][x].ignited = false;
    }
  }

  // also add a 'grass' layer to make the forest more connected
  noise.seed(Math.random());
  densityBias = (Math.random() * 2) - 1;
  for (var x = 0; x < COLUMNS; x++) {
    for (var y = 0; y < ROWS; y++) {
      let value = noise.simplex2(x / 5, y / 5);
      grid[y][x].vegetation += Math.min((value + densityBias) * 10, 0);
      grid[y][x].ignited = false;
    }
  }

  resetState();
});

// https://stackoverflow.com/questions/61339206/how-to-export-data-to-csv-using-javascript
function download_csv(data) {
  let csvHeader = Object.keys(data[0]).join(',') + '\n'; // header row
  let csvBody = data.map(row => Object.values(row).join(',')).join('\n');

  var hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvHeader + csvBody);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'data.csv';
  hiddenElement.click();
}

const downloadDataButton = document.querySelector('#download-data-button');
downloadDataButton.addEventListener('click', e => {
  e.preventDefault();
  download_csv(data);
});

requestAnimationFrame(loop);