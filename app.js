(() => {
  "use strict";
  const STORAGE_KEY = "nexus-hub-v1";
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const yesterdayKey = () => {
    const d = new Date(); d.setDate(d.getDate()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const starterGames = [
    {id:"cyber",title:"Cyberpunk 2077",platform:"PC",status:"playing",genre:"OPEN WORLD RPG",icon:"◈",art:"cyber",link:"https://store.steampowered.com/app/1091500/Cyberpunk_2077/",lastPlayed:Date.now()-3600000},
    {id:"no-mans-sky",title:"No Man's Sky",platform:"PC",status:"playing",genre:"SPACE EXPLORATION",icon:"✧",art:"space",link:"https://store.steampowered.com/app/275850/No_Mans_Sky/",lastPlayed:Date.now()-86400000},
    {id:"elden",title:"Elden Ring",platform:"PC",status:"backlog",genre:"ACTION RPG",icon:"♜",art:"fantasy",link:"https://store.steampowered.com/app/1245620/ELDEN_RING/",lastPlayed:0},
    {id:"forza",title:"Forza Horizon 5",platform:"PC",status:"backlog",genre:"OPEN WORLD RACING",icon:"⚡",art:"racer",link:"https://store.steampowered.com/app/1551360/Forza_Horizon_5/",lastPlayed:0}
  ];
  const starterQuests = [
    {id:"daily-open",title:"Enter the Nexus",description:"Open your hub and check your dashboard.",reward:25,icon:"⌂",kind:"auto"},
    {id:"library",title:"Curate your universe",description:"Visit your game library.",reward:25,icon:"▦",kind:"page",target:"library"},
    {id:"profile",title:"Make it yours",description:"Visit your profile and review your setup.",reward:25,icon:"◉",kind:"page",target:"profile"},
    {id:"add-game",title:"Expand the collection",description:"Add a game to your personal library.",reward:50,icon:"＋",kind:"add"},
    {id:"claim",title:"Claim your momentum",description:"Claim this daily reward and keep your streak alive.",reward:25,icon:"✧",kind:"claim"}
  ];
  const defaultState = () => ({
    version:1, username:"Nova", bio:"Finding the next great adventure.", accent:"violet",
    xp:0, streak:1, lastVisit:todayKey(), lastClaimDate:"", completedTotal:0,
    games:starterGames.map(g=>({...g})), recentIds:["cyber","no-mans-sky"],
    questDate:todayKey(), completedQuests:[], followedPlayers:[],
    visitedToday:[], addedGameToday:false
  });
  function loadState(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.version !== 1) return defaultState();
      const s = {...defaultState(),...saved};
      if (!Array.isArray(s.games)) s.games = starterGames.map(g=>({...g}));
      if (!Array.isArray(s.completedQuests)) s.completedQuests = [];
      if (!Array.isArray(s.visitedToday)) s.visitedToday = [];
      if (!Array.isArray(s.followedPlayers)) s.followedPlayers = [];
      if (s.questDate !== todayKey()) { s.questDate=todayKey(); s.completedQuests=[]; s.visitedToday=[]; s.addedGameToday=false; }
      const today=todayKey(), yesterday=yesterdayKey();
      if (s.lastVisit !== today) {
        s.streak = s.lastVisit === yesterday ? Math.max(1, Number(s.streak)||1)+1 : 1;
        s.lastVisit = today;
      }
      if (!s.completedQuests.includes("daily-open")) {
        s.completedQuests.push("daily-open"); s.xp += 25; s.completedTotal += 1;
      }
      localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
      return s;
    } catch(e) { return defaultState(); }
  }
  let state = loadState();
  let activeFilter = "all";
  let toastTimer = null;
  let installPrompt = null;
  const $ = (id) => document.getElementById(id);
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const xpToNext = () => 500;
  const level = () => Math.floor(Math.max(0,state.xp)/xpToNext())+1;
  const xpProgress = () => Math.max(0,state.xp)%xpToNext()/xpToNext()*100;
  const quests = () => starterQuests;
  function save(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){} renderAll(); }
  function showToast(message){
    const t=$("toast"); t.textContent=message; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),2600);
  }
  function formatCount(n){return String(n).padStart(2,"0");}
  function shortTime(ts){
    if(!ts) return "Not played yet";
    const diff=Math.max(0,Date.now()-ts);
    if(diff<3600000) return "Played recently";
    if(diff<86400000) return "Played today";
    if(diff<172800000) return "Played yesterday";
    return "Last played earlier";
  }
  function gameById(id){return state.games.find(g=>g.id===id);}
  function completeQuest(id, opts={}){
    if(state.completedQuests.includes(id)) return false;
    const q=quests().find(x=>x.id===id); if(!q) return false;
    state.completedQuests.push(id); state.xp+=q.reward; state.completedTotal+=1;
    if(id==="add-game") state.addedGameToday=true;
    save();
    if(!opts.silent) showToast(`Quest complete · +${q.reward} XP`);
    return true;
  }
  function navigate(page){
    const valid=["home","library","community","quests","profile"].includes(page)?page:"home";
    document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${valid}`));
    document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===valid));
    const labels={home:"OVERVIEW",library:"GAME LIBRARY",community:"COMMUNITY",quests:"DAILY QUESTS",profile:"PLAYER PROFILE"};
    $("crumb-page").textContent=labels[valid];
    if(valid!=="home" && !state.visitedToday.includes(valid)) {
      state.visitedToday.push(valid);
      const q=valid==="library"?"library":valid==="profile"?"profile":null;
      if(q) completeQuest(q,{silent:true}); else save();
    } else renderAll();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function renderRecent(){
    const list=$("recent-games");
    const games=state.recentIds.map(gameById).filter(Boolean).slice(0,3);
    if(!games.length){list.innerHTML='<div class="empty-state"><h3>Your next adventure starts here</h3><p>Add a game to build your library.</p></div>';return;}
    list.innerHTML=games.map(g=>`<div class="recent-game"><div class="game-art art-${safe(g.art||"custom")}"><span>${safe(g.icon||"✧")}</span></div><div class="game-info"><b>${safe(g.title)}</b><small>${safe(g.genre||g.platform)} · ${safe(shortTime(g.lastPlayed))}</small></div><span class="game-state ${g.status==="playing"?"playing":""}">${g.status==="playing"?"PLAYING":"BACKLOG"}</span><button class="play-mini" data-launch="${safe(g.id)}" title="Open game link">↗</button></div>`).join("");
  }
  function questMarkup(q, compact=false){
    const done=state.completedQuests.includes(q.id);
    if(compact) return `<div class="home-quest"><span class="quest-check ${done?"done":""}">${done?"✓":safe(q.icon)}</span><span class="home-quest-text"><b>${safe(q.title)}</b><small>${done?"Completed today":safe(q.description)}</small></span><span class="xp-pill">+${q.reward} XP</span></div>`;
    return `<article class="quest-row ${done?"completed":""}"><div class="quest-icon">${done?"✓":safe(q.icon)}</div><div class="quest-details"><h3>${safe(q.title)}</h3><p>${safe(q.description)}</p></div><div class="quest-reward">✧ +${q.reward} XP</div><button class="claim-btn ${done?"done":""}" data-quest="${safe(q.id)}" ${done?"disabled":""}>${done?"✓ Completed":q.kind==="auto"?"Auto complete":"Complete"}</button></article>`;
  }
  function renderQuests(){
    $("home-quests").innerHTML=quests().slice(0,3).map(q=>questMarkup(q,true)).join("");
    $("quest-log").innerHTML=quests().map(q=>questMarkup(q,false)).join("");
    const earned=quests().filter(q=>state.completedQuests.includes(q.id)).reduce((sum,q)=>sum+q.reward,0);
    $("quest-earned").textContent=earned;
    $("quest-progress").style.width=Math.min(100,earned/150*100)+"%";
    $("quest-streak").textContent=`${state.streak} ${state.streak===1?"day":"days"}`;
    $("quest-date").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}).toUpperCase();
    $("today-label").textContent=new Date().toLocaleDateString(undefined,{month:"short",day:"numeric"}).toUpperCase();
  }
  function renderLibrary(){
    const query=$("game-search").value.trim().toLowerCase();
    const games=state.games.filter(g=>(activeFilter==="all"||g.status===activeFilter)&&(`${g.title} ${g.platform} ${g.genre||""}`).toLowerCase().includes(query));
    $("library-count").textContent=state.games.length;
    $("stat-games").textContent=formatCount(state.games.length);
    $("library-empty").hidden=games.length>0;
    $("game-grid").innerHTML=games.map(g=>`<article class="game-card"><div class="game-cover cover-${safe(g.art||"custom")}"><span class="cover-label">${safe(g.platform.toUpperCase())}</span><span class="cover-symbol">${safe(g.icon||"✧")}</span></div><div class="game-card-body"><div class="game-card-title"><div><h3>${safe(g.title)}</h3><div class="platform">${safe(g.genre||g.platform)}</div></div><button class="more-btn" data-remove="${safe(g.id)}" title="Remove game">×</button></div><div class="game-card-bottom"><span class="game-state ${g.status==="playing"?"playing":""}">${g.status==="playing"?"PLAYING NOW":"BACKLOG"}</span><button class="launch-btn" data-launch="${safe(g.id)}">Open game ↗</button></div></div></article>`).join("");
  }
  const samplePlayers=[
    {id:"kai",name:"Kai.exe",tag:"FPS / COMPETITIVE",avatar:"K",color:"",status:"Looking for a squad"},
    {id:"mira",name:"MiraMoon",tag:"RPG / EXPLORATION",avatar:"M",color:"pink",status:"On an adventure"},
    {id:"riven",name:"Riven",tag:"RACING / SIM",avatar:"R",color:"blue",status:"Tuning the setup"},
    {id:"juno",name:"JunoByte",tag:"INDIE / CO-OP",avatar:"J",color:"",status:"Ready to play"}
  ];
  function renderCommunity(){
    const feed=[
      {avatar:"K",color:"",html:"<b>Kai.exe</b> unlocked a new achievement",detail:"Achievement hunter · 12 min ago"},
      {avatar:"M",color:"pink",html:"<b>MiraMoon</b> is exploring a new world",detail:"Adventure log · 28 min ago"},
      {avatar:"R",color:"blue",html:"<b>Riven</b> added a new game to their library",detail:"Collection update · 1 hr ago"},
      {avatar:"J",color:"",html:"<b>JunoByte</b> completed today's quest streak",detail:"Daily protocol · 2 hrs ago"}
    ];
    $("activity-feed").innerHTML=feed.map(f=>`<div class="feed-item"><div class="feed-avatar ${f.color}">${f.avatar}</div><div class="feed-copy">${f.html}<small>${f.detail}</small></div></div>`).join("");
    $("player-list").innerHTML=samplePlayers.map(p=>`<div class="player-row"><div class="feed-avatar ${p.color}">${p.avatar}</div><div class="player-details"><b>${p.name}</b><small>${p.status}</small></div><button class="follow-btn ${state.followedPlayers.includes(p.id)?"following":""}" data-follow="${p.id}">${state.followedPlayers.includes(p.id)?"Following":"＋ Follow"}</button></div>`).join("");
  }
  function renderProfile(){
    const initial=(state.username.trim()[0]||"N").toUpperCase();
    $("side-username").textContent=state.username;$("profile-name-heading").textContent=state.username;
    $("profile-bio-heading").textContent=state.bio||"Ready for the next adventure.";
    $("profile-avatar").childNodes[0].textContent=initial;
    $("top-avatar")?.setAttribute("aria-label",`${state.username} profile`);
    document.querySelector(".top-avatar").textContent=initial;
    document.querySelector(".avatar-me").textContent=initial;
    $("display-name").value=state.username;$("display-bio").value=state.bio;
    $("accent-select").value=state.accent;
    const lv=level(),progress=xpProgress();
    $("side-level").textContent=`LVL ${String(lv).padStart(2,"0")}`;$("side-xp").textContent=`${state.xp%500} / 500 XP`;
    document.querySelector(".side-progress span").style.width=progress+"%";
    $("stat-xp").textContent=String(state.xp).padStart(3,"0");$("stat-streak").textContent=formatCount(state.streak);
    $("profile-level").textContent=`LEVEL ${String(lv).padStart(2,"0")}`;$("profile-streak").textContent=`${state.streak} DAY${state.streak===1?"":"S"} STREAK`;
    $("profile-game-count").textContent=`${state.games.length} GAMES`;$("profile-xp").textContent=String(state.xp).padStart(3,"0");
    $("profile-progress").style.width=progress+"%";$("profile-next").textContent=`${500-(state.xp%500)} XP TO NEXT LEVEL`;
    $("lifetime-quests").textContent=state.completedTotal;$("lifetime-games").textContent=state.games.length;
    $("lifetime-level").textContent=String(lv).padStart(2,"0");$("lifetime-xp").textContent=String(state.xp).padStart(3,"0");
    document.body.classList.toggle("accent-pink",state.accent==="pink");
    document.body.classList.toggle("accent-blue",state.accent==="blue");
  }
  function renderAll(){renderRecent();renderQuests();renderLibrary();renderCommunity();renderProfile();}
  function openGame(id){
    const g=gameById(id); if(!g)return;
    g.lastPlayed=Date.now();state.recentIds=[id,...state.recentIds.filter(x=>x!==id)].slice(0,5);
    save();
    if(g.link){
      try { const u=new URL(g.link); if(["https:","http:","steam:"].includes(u.protocol)){window.open(g.link,"_blank","noopener,noreferrer");showToast(`Opening ${g.title} link…`);}else showToast("Only web links are supported in this preview.");}
      catch(e){showToast("This game link isn't valid yet.");}
    } else showToast("No launch link set. Edit the game or add a store link.");
  }
  function openModal(){ $("game-modal").hidden=false;setTimeout(()=>$("new-game-title").focus(),30); }
  function closeModal(){ $("game-modal").hidden=true;$("add-game-form").reset(); }
  function addGame(event){
    event.preventDefault();
    const title=$("new-game-title").value.trim();if(!title)return;
    const rawLink=$("new-game-link").value.trim();let link="";
    if(rawLink){try{const u=new URL(rawLink);if(!["https:","http:","steam:"].includes(u.protocol))throw new Error();link=u.href;}catch(e){showToast("Please enter a valid http(s) or Steam link.");return;}}
    const palette=["cyber","space","fantasy","racer","custom"];
    const icons=["✧","◈","♜","⚡","⬡"];
    const game={id:"game-"+Date.now().toString(36),title,platform:$("new-game-platform").value,status:$("new-game-status").value,genre:"YOUR COLLECTION",icon:icons[Math.floor(Math.random()*icons.length)],art:palette[Math.floor(Math.random()*palette.length)],link,lastPlayed:0};
    state.games.unshift(game);state.addedGameToday=true;state.recentIds=[game.id,...state.recentIds].slice(0,5);
    completeQuest("add-game",{silent:true});save();closeModal();$("game-search").value="";activeFilter="all";
    document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));
    showToast(`${title} added to your universe.`);
  }
  function exportData(){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`nexus-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(url);showToast("Your Nexus backup is ready.");
  }
  function resetData(){
    if(!confirm("Reset Nexus data on this device? This removes your games, XP, profile edits and quest progress."))return;
    state=defaultState();save();navigate("home");showToast("Local Nexus data reset.");
  }
  document.addEventListener("click",event=>{
    const nav=event.target.closest("[data-page]");if(nav){event.preventDefault();navigate(nav.dataset.page);return;}
    const launch=event.target.closest("[data-launch]");if(launch){openGame(launch.dataset.launch);return;}
    const quest=event.target.closest("[data-quest]");if(quest){const q=quests().find(x=>x.id===quest.dataset.quest);if(q?.kind==="page"){navigate(q.target);return;}if(q?.kind==="add"){openModal();return;}if(q?.kind==="claim"){completeQuest(q.id);return;}if(q?.kind==="auto"){completeQuest(q.id);return;}}
    const filter=event.target.closest("[data-filter]");if(filter){activeFilter=filter.dataset.filter;document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b===filter));renderLibrary();return;}
    const follow=event.target.closest("[data-follow]");if(follow){const id=follow.dataset.follow;state.followedPlayers=state.followedPlayers.includes(id)?state.followedPlayers.filter(x=>x!==id):[...state.followedPlayers,id];save();showToast(state.followedPlayers.includes(id)?"Player added to your local squad.":"Player removed from your local squad.");return;}
    const remove=event.target.closest("[data-remove]");if(remove){const g=gameById(remove.dataset.remove);if(g&&confirm(`Remove ${g.title} from your library?`)){state.games=state.games.filter(x=>x.id!==g.id);state.recentIds=state.recentIds.filter(x=>x!==g.id);save();showToast("Game removed from your library.");}return;}
  });
  $("game-search").addEventListener("input",renderLibrary);
  $("add-game-open").addEventListener("click",openModal);
  $("add-game-close").addEventListener("click",closeModal);
  $("game-modal").addEventListener("click",e=>{if(e.target===$("game-modal"))closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  $("add-game-form").addEventListener("submit",addGame);
  $("quick-quest").addEventListener("click",()=>navigate("quests"));
  $("profile-form").addEventListener("submit",e=>{
    e.preventDefault();const name=$("display-name").value.trim();if(!name){showToast("Choose a display name first.");return;}
    state.username=name;state.bio=$("display-bio").value.trim();state.accent=$("accent-select").value;save();$("profile-saved").textContent="Profile saved on this device.";showToast("Your profile is updated.");
  });
  $("export-data").addEventListener("click",exportData);
  $("reset-data").addEventListener("click",resetData);
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("install-btn").hidden=false;});
  $("install-btn").addEventListener("click",async()=>{if(!installPrompt){showToast("Use your browser menu and choose Install app / Add to Home Screen.");return;}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("install-btn").hidden=true;});
  if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  // Daily opening reward is credited once per local day in loadState().
  renderAll();
})();