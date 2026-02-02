const screens = {
  menu: menu,
  prep: prep,
  game: game
};

const boardEl = document.getElementById("board");
const turnInfo = document.getElementById("turnInfo");
const endOverlay = document.getElementById("endOverlay");

const EMOJI = {
  daimyo: "👑",
  samurai: "🗡️",
  ninja: "🥷",
  ashigaru: "🛡️"
};

let board, players, currentPlayer;
let selected = null, highlights = [];
let gameOver = false;

function showPrep(){ switchScreen("prep"); }

function switchScreen(name){
  Object.values(screens).forEach(s=>s.classList.remove("active"));
  screens[name].classList.add("active");
}

function startGame(){
  players = {
    1: { type: p1.value, dir: -1 },
    2: { type: p2.value, dir: 1 }
  };
  currentPlayer = 1;
  gameOver = false;
  initBoard();
  switchScreen("game");
  updateTurnInfo();
  if(players[currentPlayer].type==="ai") aiTurn();
}

function initBoard(){
  board = Array.from({length:7},()=>Array(7).fill(null));
  boardEl.innerHTML = "";

  for(let y=0;y<7;y++){
    for(let x=0;x<7;x++){
      const c=document.createElement("div");
      c.className="cell";
      c.onclick=()=>onCell(x,y,c);
      boardEl.appendChild(c);
    }
  }

  const back=[["ashigaru",0],["samurai",1],["daimyo",3],["samurai",5],["ashigaru",6]];
  back.forEach(s=>{
    place(1,s[0],s[1],6);
    place(2,s[0],s[1],0);
  });

  place(1,"ninja",2,5); place(1,"ashigaru",3,5); place(1,"ninja",4,5);
  place(2,"ninja",2,1); place(2,"ashigaru",3,1); place(2,"ninja",4,1);

  render();
}

function place(p,t,x,y){ board[y][x]={p,t,x,y}; }

function render(){
  [...boardEl.children].forEach((c,i)=>{
    const x=i%7,y=Math.floor(i/7);
    c.className="cell";
    c.textContent="";
    const u=board[y][x];
    if(u){
      c.textContent=EMOJI[u.t];
      c.classList.add(u.p===1?"p1":"p2");
    }
  });

  highlights.forEach(h=>{
    const idx=h.y*7+h.x;
    boardEl.children[idx].classList.add(h.cap?"capture":"move");
  });
}

function onCell(x,y,cell){
  if(gameOver || players[currentPlayer].type!=="human") return;

  const u=board[y][x];

  if(selected && highlights.some(h=>h.x===x&&h.y===y)){
    executeMove(selected,x,y);
    return;
  }

  if(u && u.p===currentPlayer){
    selected=u;
    highlights=legalMoves(u);
    render();
  } else {
    cell.classList.add("shake");
    setTimeout(()=>cell.classList.remove("shake"),200);
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
    add(u.x+1,u.y); add(u.x-1,u.y);
    add(u.x,u.y+1); add(u.x,u.y-1);
  }

  if(u.t==="ninja")
    for(let dx=-2;dx<=2;dx++)
      for(let dy=-2;dy<=2;dy++)
        if(dx||dy) add(u.x+dx,u.y+dy);

  if(u.t==="ashigaru"){
    add(u.x,u.y+d);
    add(u.x-1,u.y+d);
    add(u.x+1,u.y+d);
  }

  return res;
}

function executeMove(u,x,y){
  const target=board[y][x];
  board[u.y][u.x]=null;

  if(target && target.t==="daimyo"){
    endGame(u.p);
    return;
  }

  u.x=x; u.y=y;
  board[y][x]=u;
  endTurn();
}

function endTurn(){
  selected=null; highlights=[];
  currentPlayer=currentPlayer===1?2:1;
  updateTurnInfo();
  render();
  if(players[currentPlayer].type==="ai") aiTurn();
}

function updateTurnInfo(){
  turnInfo.textContent=`Player ${currentPlayer} (${players[currentPlayer].type}) turn`;
}

function endGame(winner){
  gameOver=true;
  endOverlay.textContent=`Player ${winner} Wins`;
  endOverlay.classList.remove("hidden");
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
    executeMove(pick.u,pick.m.x,pick.m.y);
  },500);
}

function toggleInfo(){
  infoPanel.classList.toggle("hidden");
}