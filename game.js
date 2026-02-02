const screens = {
  menu: document.getElementById("menu"),
  prep: document.getElementById("prep"),
  game: document.getElementById("game")
};

const boardEl = document.getElementById("board");
const infoEl = document.getElementById("info");

const EMOJI = {
  daimyo: "👑",
  samurai: "🗡️",
  ninja: "🥷",
  ashigaru: "🛡️"
};

let board, players, currentPlayer;
let selected = null;
let highlights = [];

function show(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function goPrep() { show("prep"); }

function startGame() {
  players = {
    1: { type: p1.value, dir: -1 },
    2: { type: p2.value, dir: 1 }
  };
  currentPlayer = 1;
  initBoard();
  show("game");
  updateInfo();
  if (players[currentPlayer].type === "ai") aiTurn();
}

function initBoard() {
  board = Array.from({ length: 7 }, () => Array(7).fill(null));
  boardEl.innerHTML = "";

  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const c = document.createElement("div");
      c.className = "cell";
      c.onclick = () => clickCell(x, y);
      boardEl.appendChild(c);
    }
  }

  const setup = [
    ["ashigaru",0],["samurai",1],["daimyo",3],["samurai",5],["ashigaru",6]
  ];

  setup.forEach(s => {
    place(1, s[0], s[1], 6);
    place(2, s[0], s[1], 0);
  });

  place(1,"ninja",2,5); place(1,"ashigaru",3,5); place(1,"ninja",4,5);
  place(2,"ninja",2,1); place(2,"ashigaru",3,1); place(2,"ninja",4,1);

  render();
}

function place(p,t,x,y){ board[y][x]={p,t,x,y}; }

function render() {
  document.querySelectorAll(".cell").forEach((c,i)=>{
    const x=i%7, y=Math.floor(i/7);
    c.className="cell";
    c.textContent="";
    const u=board[y][x];
    if(u){
      c.textContent=EMOJI[u.t];
      if(u===selected) c.classList.add("selected");
    }
  });

  highlights.forEach(h=>{
    const idx=h.y*7+h.x;
    boardEl.children[idx].classList.add(h.cap?"capture":"move");
  });
}

function clickCell(x,y){
  if(players[currentPlayer].type!=="human") return;

  const u=board[y][x];

  if(selected && highlights.some(h=>h.x===x&&h.y===y)){
    move(selected,x,y);
    endTurn();
    return;
  }

  if(u && u.p===currentPlayer){
    selected=u;
    highlights=legalMoves(u);
    render();
  }
}

function legalMoves(u){
  const res=[];
  const d=players[u.p].dir;

  const add=(x,y)=>{
    if(x<0||y<0||x>6||y>6) return;
    const t=board[y][x];
    if(!t) res.push({x,y});
    else if(t.p!==u.p) res.push({x,y,cap:true});
  };

  if(u.t==="daimyo")
    for(let dx=-1;dx<=1;dx++)
      for(let dy=-1;dy<=1;dy++)
        if(dx||dy) add(u.x+dx,u.y+dy);

  if(u.t==="samurai"){
    add(u.x,u.y+d); add(u.x-1,u.y); add(u.x+1,u.y);
  }

  if(u.t==="ninja"){
    for(let dx=-2;dx<=2;dx++)
      for(let dy=-2;dy<=2;dy++)
        if(dx||dy) add(u.x+dx,u.y+dy);
  }

  if(u.t==="ashigaru"){
    add(u.x,u.y+d);
    add(u.x-1,u.y+d);
    add(u.x+1,u.y+d);
  }

  return res;
}

function move(u,x,y){
  const target=board[y][x];
  board[u.y][u.x]=null;

  if(target && target.t==="daimyo"){
    infoEl.textContent=`Player ${u.p} wins`;
    return;
  }

  u.x=x; u.y=y;
  board[y][x]=u;
}

function endTurn(){
  selected=null; highlights=[];
  currentPlayer=currentPlayer===1?2:1;
  updateInfo();
  render();
  if(players[currentPlayer].type==="ai") aiTurn();
}

function updateInfo(){
  infoEl.textContent=`Player ${currentPlayer} turn`;
}

function aiTurn(){
  setTimeout(()=>{
    const moves=[];
    board.flat().forEach(u=>{
      if(u&&u.p===currentPlayer)
        legalMoves(u).forEach(m=>moves.push({u,m}));
    });
    if(!moves.length) return;
    const pick=moves[Math.floor(Math.random()*moves.length)];
    move(pick.u,pick.m.x,pick.m.y);
    endTurn();
  },400);
}