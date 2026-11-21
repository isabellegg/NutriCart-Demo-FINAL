const meals = [
  {name:'Sesame salmon rice bowl',time:35,kcal:610,protein:38,pos:0,color:'green'},
  {name:'Ginger chicken noodles',time:30,kcal:585,protein:42,pos:1,color:'yellow'},
  {name:'Tofu vegetable stir-fry',time:25,kcal:520,protein:26,pos:2,color:'yellow'},
  {name:'Avocado egg toast',time:15,kcal:460,protein:22,pos:3,color:'pink'},
  {name:'Lemon herb fish & greens',time:28,kcal:490,protein:40,pos:4,color:'blue'},
  {name:'Tomato chickpea pasta',time:40,kcal:570,protein:24,pos:5,color:'orange'},
  {name:'Quick tofu noodle bowl',time:15,kcal:545,protein:29,pos:2,color:'yellow'}
];

const initialBasket = [
  {id:'broccoli',cat:'Produce',icon:'🥦',name:'Broccoli',note:'500 g · used in 3 meals',qty:1,source:'Verified product'},
  {id:'avocado',cat:'Produce',icon:'🥑',name:'Avocados',note:'Pack of 2 · used in 2 meals',qty:1,source:'Verified product'},
  {id:'tomatoes',cat:'Produce',icon:'🍅',name:'Cherry tomatoes',note:'300 g · used in 2 meals',qty:1,source:'Generic item'},
  {id:'salmon',cat:'Protein',icon:'🐟',name:'Salmon fillets',note:'2 portions · used in 1 meal',qty:1,source:'Verified product'},
  {id:'tofu',cat:'Protein',icon:'◻️',name:'Firm tofu',note:'400 g · used in 2 meals',qty:1,source:'Verified product'},
  {id:'eggs',cat:'Chilled items',icon:'🥚',name:'Free-range eggs',note:'6 pack · used in 2 meals',qty:1,source:'Verified product'},
  {id:'rice',cat:'Grains and pantry',icon:'🍚',name:'Jasmine rice',note:'Already available at home',qty:0,source:'Already in pantry'},
  {id:'noodles',cat:'Grains and pantry',icon:'🍜',name:'Wholewheat noodles',note:'2 packs · used in 2 meals',qty:2,source:'Price at checkout'}
];

const state = {
  screen:'copilot', selected:[], planReady:false, basket:structuredClone(initialBasket),
  review:false, checks:[false,false,false], date:'Sat 23', slot:'10–12', ordered:false,
  adapted:false, cooking:false, cookStep:1, feedback:[], demoStep:1, suggestionIndex:0,
  rejected:[], activeDay:0, deliveryStage:0, aiBusy:false, aiSummary:null, basketOptimised:false,
  pendingChange:'', lastChange:null, planHorizon:'This week', monthlyWeeks:0, activeMonthWeek:0, monthlyPlans:[],
  viewWeekOffset:0, weekPlans:{}, editingPast:false,
  profile:{goal:'Balanced eating',allergies:'Peanuts',restrictions:'No peanuts',dislikes:['Coriander','Mushroom'],household:2,servings:2,budget:500,cookTime:'15–40 min',skill:'Intermediate',cuisines:'Asian, Mediterranean',trainingDays:'Tuesday, Thursday',busyDays:'Wednesday evening',deliveryDays:'Saturday',pantry:'Rice, cooking oil'}
};

const app = document.querySelector('#app');
const modalRoot = document.querySelector('#modalRoot');
const toastEl = document.querySelector('#toast');

function toast(message){toastEl.textContent=message;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),2300)}
function setScreen(screen){state.screen=screen;state.cooking=false;render();app.scrollTop=0}
function setActiveNav(){document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===state.screen));const badge=document.querySelector('#basketBadge');const count=state.ordered?state.basket.filter(x=>x.qty>0).length:state.selected.length;badge.textContent=count;badge.classList.toggle('hidden',!count)}
function head(kicker,title,copy=''){return `<div class="screen-head"><span class="kicker">${kicker}</span><h2>${title}</h2>${copy?`<p>${copy}</p>`:''}</div>`}
function food(pos,cls=''){return `<div class="food-art p${pos} ${cls}" role="img" aria-label="Colourful sketch illustration of ${meals[pos]?.name||'a meal'}"></div>`}
function mealThumb(pos){return `<div class="meal-thumb p${pos}" role="img" aria-label="${meals[pos]?.name||'Meal'} sketch"></div>`}
function button(label,action,kind='primary',extra=''){return `<button class="btn ${kind} ${extra}" data-action="${action}">${label}</button>`}
function currentSuggestion(){let attempts=0;while(state.rejected.includes(state.suggestionIndex%meals.length)&&attempts<meals.length){state.suggestionIndex=(state.suggestionIndex+1)%meals.length;attempts++}return state.suggestionIndex%meals.length}
function aiIcon(){return `<span class="ai-icon" aria-hidden="true">✦</span>`}

function renderNutrition(){
  app.innerHTML = head('Profile complete','Your nutrition plan is ready','A practical starting point for Alex’s balanced-eating week.') + `
    <section class="card dark">
      <div class="row between"><div><span class="label" style="color:#bcd2c1">Selected goal</span><div style="font:800 1.25rem Manrope;margin-top:3px">${state.profile.goal}</div></div><span style="font-size:2rem">◎</span></div>
      <div class="progress" style="margin:16px 0 7px;background:#557d62"><i style="width:78%;background:#FFB832"></i></div>
      <div class="fine" style="color:#d8e5da">Illustrative daily energy range</div><div style="font:800 1.65rem Manrope;margin-top:2px">1,900–2,100 kcal</div>
    </section>
    <div class="macro-row"><div class="macro protein"><b>105 g</b><span>Protein guidance</span></div><div class="macro carbs"><b>235 g</b><span>Carbohydrates</span></div><div class="macro fat"><b>65 g</b><span>Fats</span></div></div>
    <section class="card" style="margin-top:12px">
      <div class="metric-grid">
        <div class="metric"><span class="label">Restriction</span><div class="value" style="font-size:.88rem;margin-top:5px">No peanuts</div></div>
        <div class="metric"><span class="label">Household</span><div class="value" style="font-size:.88rem;margin-top:5px">2 servings</div></div>
        <div class="metric"><span class="label">Weekly budget</span><div class="value" style="font-size:.88rem;margin-top:5px">HK$500</div></div>
        <div class="metric"><span class="label">Cook time</span><div class="value" style="font-size:.88rem;margin-top:5px">15–40 min</div></div>
      </div>
      <p class="verified" style="margin:14px 0 0">Checked using NutriCart’s nutrition rules</p>
      <p class="fine">Illustrative planning information only. NutriCart does not provide medical advice.</p>
    </section>
    <div class="button-row">${button('Edit profile','profile','ghost')}${button(`${aiIcon()} Generate my week`,'generate-week')}</div>`;
}

function planIndices(){return state.planReady?state.selected:state.selected}
function persistCurrentWeek(){if(state.planReady&&state.selected.length)state.weekPlans[state.viewWeekOffset]={meals:[...state.selected],lastChange:state.lastChange?{...state.lastChange}:null}}
function weekLabel(){if(state.viewWeekOffset===0)return'This week';if(state.viewWeekOffset===1)return'Next week';if(state.viewWeekOffset===-1)return'Previous week';return state.viewWeekOffset<0?`${Math.abs(state.viewWeekOffset)} weeks ago`:`${state.viewWeekOffset} weeks ahead`}
function calendarDates(){
  const start=new Date(2026,10,23);start.setDate(start.getDate()+state.viewWeekOffset*7);
  return Array.from({length:7},(_,i)=>{const date=new Date(start);date.setDate(start.getDate()+i);return{day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()],date:date.getDate(),month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]}})
}
function changeViewedWeek(offset){persistCurrentWeek();state.viewWeekOffset=offset;state.activeMonthWeek=Math.max(0,offset-1);state.activeDay=0;state.editingPast=false;const saved=state.weekPlans[offset];state.selected=saved?[...saved.meals]:[];state.planReady=!!saved;state.lastChange=saved?.lastChange||null;state.planHorizon=weekLabel();renderHome();app.scrollTop=0}
function renderHome(){
  const plan=planIndices();
  const mealCount=plan.length;
  const activeMeal=mealCount?meals[plan[state.activeDay%mealCount]]:null;
  const dates=calendarDates();
  app.innerHTML = head(state.ordered?'Order confirmed':weekLabel(),'Your week at a glance',state.planReady?`${mealCount} meal${mealCount===1?'':'s'} built around Alex’s profile, schedule and preferences.`:'This week has not been planned yet.') + `
    ${state.monthlyWeeks===4&&state.viewWeekOffset>=1&&state.viewWeekOffset<=4?`<section class="month-overview">${[1,2,3,4].map(w=>`<button class="month-week ${w===state.viewWeekOffset?'active':''}" data-action="select-month-week" data-week="${w}"><span>Week ${w}</span><b>${state.weekPlans[w]?.meals.length||5} meals</b><small>${w===state.viewWeekOffset?'Viewing':'AI planned'}</small></button>`).join('')}</section>`:''}
    <div class="calendar-title">${dates[0].month===dates[6].month?dates[0].month:`${dates[0].month}–${dates[6].month}`} 2026</div>
    <div class="calendar-navigation"><button data-action="previous-week" aria-label="Previous week">‹</button><span>${dates[0].date} ${dates[0].month}–${dates[6].date} ${dates[6].month}</span><button data-action="next-week" aria-label="Next week">›</button></div>
    <button class="today-button" data-action="today-week" ${state.viewWeekOffset===0?'disabled':''}>Today</button>
    <div class="week-strip">${dates.map((d,i)=>`<button class="day ${i===state.activeDay?'active':''}" data-action="select-day" data-index="${i}">${d.day}<b>${d.date}</b><small>${d.month}</small></button>`).join('')}</div>
    ${!state.planReady?`<section class="card unplanned-week"><div class="empty-calendar">✦</div><span class="label">Unplanned week</span><h3>No plan generated for ${weekLabel().toLowerCase()}</h3><p class="fine">Use Alex’s saved profile and schedule, or copy the closest previous plan.</p>${button(`${aiIcon()} Generate with Copilot`,'generate-current-week','primary','full')}${button('Copy previous week','copy-previous-week','secondary','full')}</section>`:''}
    ${state.planReady?`${state.viewWeekOffset<0?`<section class="past-week-notice"><span>Past plan · ${state.editingPast?'editing enabled':'read only'}</span>${state.editingPast?'':button('Edit past plan','edit-past-plan','text')}</section>`:''}<section class="card tint" style="margin-top:12px"><div class="row between"><div><span class="label">Weekly nutrition</span><div class="value">On track</div></div><div style="text-align:right"><span class="label">Meals selected</span><div class="value">${mealCount}</div></div></div><div class="progress" style="margin-top:12px"><i style="width:${Math.min(100,55+mealCount*7)}%"></i></div><div class="row between fine" style="margin-top:6px"><span>Restrictions checked</span><span>Budget within limit</span></div></section>
      ${activeMeal?`<section class="card active-day-card">${food(activeMeal.pos,'day-hero')}<div class="row between"><div><span class="label">${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][state.activeDay]}</span><h3>${activeMeal.name}</h3><p class="fine">${activeMeal.kcal} kcal · ${activeMeal.protein} g protein · ${activeMeal.time} min</p></div><span class="match-score">92%<small>AI match</small></span></div><div class="button-row">${button('Recipe','active-meal-detail','ghost')}${button(`${aiIcon()} Adapt this day`,'adapt-day','secondary')}</div></section>`:''}
      <div class="schedule">${plan.map((idx,i)=>{const m=meals[idx];return `<button class="schedule-item ${state.viewWeekOffset<0?'completed':''}" data-action="meal-detail" data-index="${idx}"><span class="dow">${state.viewWeekOffset<0?'✓':['MON','TUE','WED','THU','FRI','SAT','SUN'][i%7]}</span>${mealThumb(m.pos)}<span><h4>${m.name}</h4><p>${m.kcal} kcal · ${m.protein} g protein</p></span><span class="time">${state.viewWeekOffset<0?'Done':`${m.time} min`}</span></button>`}).join('')}</div>
      ${state.ordered?`${deliveryTracking()}${button('Track delivery','track-delivery','primary','full')}`:`${button('View suggested basket','view-basket','primary','full')}`}`:
      `<section class="card yellow" style="margin-top:12px"><span class="label">Weekly plan</span><h3 style="margin:4px 0 6px">No meals selected yet</h3><p class="fine" style="font-size:.78rem">Choose sketch-style recipe cards and NutriCart will build the basket alongside your week.</p>${button('Complete your week','choose-meals','primary','full')}</section>`}
    ${state.lastChange?`<section class="card change-confirmed"><div class="row between"><span class="label">Copilot update applied</span><span class="verified">Updated</span></div><h3>${state.lastChange.day}: ${state.lastChange.meal}</h3><p class="fine">${state.lastChange.request}</p></section>`:''}
    <section class="change-card"><h3>Change of plans?</h3><p>Tell NutriCart when your schedule, budget or cooking time changes.</p>${button(state.planReady?'Tell NutriCart':'Available after planning','change-plans',state.planReady?'ghost':'secondary')}</section>
    <section class="card plan-ahead"><div class="row between"><div><span class="label">Plan ahead with Copilot</span><h3>Prepare early, stay flexible</h3></div>${aiIcon()}</div><p class="fine">Generate an explainable plan for next week or preview four connected weeks.</p><div class="button-row">${button('Plan next week','plan-next-week','ghost')}${button('Plan next month','plan-next-month','secondary')}</div></section>`;
}

function renderMeals(){
  const index=currentSuggestion();const m=meals[index];let nextIndex=(index+1)%meals.length;while(state.rejected.includes(nextIndex)&&nextIndex!==index)nextIndex=(nextIndex+1)%meals.length;const next=meals[nextIndex];
  app.innerHTML = head('Meal discovery','Choose meals for your week','Swipe down to add. Swipe up to pass. Choose as many meals as suit your week.') + `
    <button class="selected-basket" data-action="view-selected"><span>Weekly basket · ${state.rejected.length} passed</span><strong>${state.selected.length} meal${state.selected.length===1?'':'s'} selected</strong></button>
    ${state.rejected.length?`<div class="rejected-strip"><span>Passed:</span>${state.rejected.map(i=>`<b>${meals[i].name}</b>`).join('')}</div>`:''}
    ${state.planReady?`<section class="card tint" style="margin-top:16px;text-align:center"><div style="font-size:2rem">✓</div><h3 style="margin:5px">Your week is ready</h3><p class="fine">${state.selected.length} healthy meal${state.selected.length===1?'':'s'} checked against Alex’s profile.</p>${button('View weekly plan','go-home','primary','full')}</section>`:`
    <div class="recipe-stage" id="recipeStage">
      <article class="recipe-card behind">${food(next.pos)}</article>
      <article class="recipe-card front" id="recipeCard">${food(m.pos)}<div class="recipe-info"><div class="row between"><span class="label">${state.profile.goal}</span><span class="match-inline">92% AI match</span></div><h3>${m.name}</h3><div class="recipe-meta"><span class="meta-pill">◷ ${m.time} min</span><span class="meta-pill">${m.kcal} kcal</span><span class="meta-pill">${m.protein} g protein</span><span class="meta-pill">Avoids dislikes</span></div><div class="drag-hint"><span>↑ Pass</span><span>Swipe</span><span>Add ↓</span></div></div></article>
    </div>
    <div class="recipe-actions"><button class="circle-action" data-action="skip-meal" aria-label="Pass and see another meal">↑</button>${button('Add to week','add-meal') }<button class="circle-action" data-action="why-meal" aria-label="View recipe and cooking instructions">?</button></div>
    ${state.selected.length>0?`<div style="margin-top:10px">${button(`Complete week with ${state.selected.length} meal${state.selected.length===1?'':'s'}`,'complete-plan','secondary','full')}</div>`:''}`}`;
  if(!state.planReady)setupRecipeDrag();
}

function setupRecipeDrag(){
  const card=document.querySelector('#recipeCard');if(!card)return;let startY=0,dy=0,active=false;
  card.addEventListener('pointerdown',e=>{active=true;startY=e.clientY;card.setPointerCapture(e.pointerId)});
  card.addEventListener('pointermove',e=>{if(!active)return;dy=e.clientY-startY;card.style.transform=`translateY(${dy}px) rotate(${dy/38}deg)`;card.style.opacity=`${Math.max(.55,1-Math.abs(dy)/430)}`});
  const finish=()=>{if(!active)return;active=false;if(dy>80){addMeal()}else if(dy<-80){skipMeal()}else{card.style.transform='';card.style.opacity=''}dy=0};
  card.addEventListener('pointerup',finish);card.addEventListener('pointercancel',finish);
}

function renderBasket(){
  if(!state.planReady){app.innerHTML=head('Meal basket',`${state.selected.length} meal${state.selected.length===1?'':'s'} selected`,'Your choices stay here while you explore. Complete the week whenever you are ready.')+`${state.selected.length?`<div class="schedule">${state.selected.map((idx,i)=>{const m=meals[idx];return `<div class="schedule-item"><span class="dow">${i+1}</span>${mealThumb(m.pos)}<span><h4>${m.name}</h4><p>${m.kcal} kcal · ${m.protein} g protein</p></span><button class="remove-choice" data-action="remove-choice" data-index="${i}" aria-label="Remove ${m.name}">×</button></div>`}).join('')}</div>${button('Complete my week','complete-plan','primary','full')}`:`<section class="card yellow" style="text-align:center"><div style="font-size:2.5rem">▱</div><h3 style="margin:5px">No meals selected yet</h3></section>`}${button('Keep choosing meals','choose-meals','secondary','full')}`;return}
  if(state.review){renderReview();return}
  const active=state.basket.filter(x=>x.qty>0);const cats=[...new Set(active.map(x=>x.cat))];
  app.innerHTML = head(`${state.selected.length} planned meals`,'Your suggested weekly basket','Pantry items are deducted. Review every quantity before the retailer hand-off.') + `
    ${state.ordered?`${deliveryTracking()}${button('Open delivery tracking','track-delivery','secondary','full')}`:''}
    <section class="card"><div class="row between"><span class="label">Meals covered</span><strong>${state.selected.length}</strong></div><div class="selected-meal-list">${state.selected.map((idx,i)=>`<div>${mealThumb(meals[idx].pos)}<span><b>${meals[idx].name}</b><small>${meals[idx].protein} g protein</small></span><button data-action="remove-choice" data-index="${i}" aria-label="Remove ${meals[idx].name}">×</button></div>`).join('')}</div></section>
    <section class="card ai-basket"><div class="row between"><div><span class="label">${aiIcon()} Copilot basket check</span><h3>${state.basketOptimised?'Basket optimised':'Reduce cost and food waste'}</h3></div><span class="verified">${state.basketOptimised?'HK$487':'Ready'}</span></div><p class="fine">${state.basketOptimised?'14 items · 1 potential leftover · every meal covered':'Compare quantities, pantry deductions, substitutions and likely leftovers before checkout.'}</p>${state.basketOptimised?'':button('Optimise basket with AI','optimise-basket','secondary','full')}</section>
    <section class="card tint basket-head"><div><span class="label">Basket summary</span><h3 style="margin:4px 0 0">${active.length} grocery items</h3><p class="fine">1 pantry item already available</p></div><div class="count">${active.length}</div></section>
    <div class="searchbar"><input id="itemSearch" placeholder="Search or add an item" aria-label="Search or add an item"><button data-action="add-search-item">Add</button></div>
    ${cats.map(cat=>`<div class="category-title">${cat}</div>${active.filter(x=>x.cat===cat).map(item=>basketRow(item)).join('')}`).join('')}
    <section class="card flat"><div class="row between"><span class="fine">Retailer information</span><span class="verified">Hand-off demo</span></div><p class="fine">Prices and live availability are confirmed at retailer checkout.</p></section>
    <div class="sticky-actions">${button('Review weekly order','review-order','primary','full')}</div>`;
}
function basketRow(item){return `<div class="basket-row"><div class="ingredient-icon">${item.icon}</div><div><h4>${item.name}</h4><p>${item.note}</p><p class="verified" style="margin:4px 0 0">${item.source}</p><button class="remove-btn" data-action="remove-item" data-id="${item.id}">Remove</button></div><div class="qty"><button data-action="qty-down" data-id="${item.id}">−</button><span>${item.qty}</span><button data-action="qty-up" data-id="${item.id}">+</button></div></div>`}

function renderReview(){
  if(state.review==='delivery'){renderDelivery();return}
  if(state.review==='confirmed'){renderConfirmation();return}
  app.innerHTML = head('Human approval','Review and confirm','NutriCart will not place an order or approve a substitution without your confirmation.') + `
    <section class="card"><div class="row between"><span class="label">Weekly plan</span><strong>${state.selected.length} meals</strong></div><div class="setting"><div><h4>Grocery products</h4><p>Verified and generic items</p></div><span>${state.basket.filter(x=>x.qty>0).length} items</span></div><div class="setting"><div><h4>Pantry deductions</h4><p>Rice and cooking oil</p></div><span>Confirmed</span></div><div class="setting"><div><h4>Substitutions</h4><p>One user-approved option</p></div><span>1</span></div></section>
    <section class="card yellow"><span class="label">Items needing retailer confirmation</span><p class="fine" style="font-size:.78rem">Live prices and availability are confirmed at checkout. No retailer prices have been invented in this demo.</p></section>
    <section class="card">${['I have reviewed my dietary restrictions.','I approve the selected substitutions.','I have reviewed the basket quantities.'].map((x,i)=>`<label class="checkline"><input type="checkbox" data-check="${i}" ${state.checks[i]?'checked':''}><span>${x}</span></label>`).join('')}</section>
    ${button('Choose delivery','choose-delivery',state.checks.every(Boolean)?'primary':'secondary','full')}
    ${button('Back to basket','back-basket','text','full')}`;
}

function renderDelivery(){
  app.innerHTML = head('Retailer fulfilment demo','Choose a delivery slot','Select the preferred date and time for Alex’s weekly order.') + `
    <section class="card blue"><span class="label">Delivery address</span><h3 style="margin:5px 0;font-size:.95rem">Central, Hong Kong</h3><p class="fine">Illustrative address · payment is not processed</p></section>
    <div class="category-title">Delivery date</div><div class="calendar">${['Fri 22','Sat 23','Sun 24','Mon 25'].map(x=>{const [d,n]=x.split(' ');return `<button class="date-btn ${state.date===x?'active':''}" data-action="select-date" data-value="${x}">${d}<b>${n}</b>Nov</button>`}).join('')}</div>
    <div class="category-title">Time window</div><div class="slot-grid">${['8–10','10–12','16–18'].map(x=>`<button class="slot ${state.slot===x?'active':''}" data-action="select-slot" data-value="${x}">${x}</button>`).join('')}</div>
    <section class="card" style="margin-top:14px"><div class="row between"><div><span class="label">Basket</span><h3 style="font-size:.95rem;margin:4px 0">${state.basket.filter(x=>x.qty>0).length} items · ${state.selected.length} meals</h3></div><span class="verified">Ready</span></div><p class="fine">Live stock, payment and delivery require a participating retailer.</p></section>
    ${button('Place demo weekly order','place-order','primary','full')}${button('Back to review','back-review','text','full')}`;
}

function renderConfirmation(){
  app.innerHTML = `<section style="text-align:center;padding-top:28px"><div style="width:70px;height:70px;border-radius:25px;background:var(--green);color:white;display:grid;place-items:center;font-size:2rem;margin:auto;transform:rotate(-4deg)">✓</div><div class="screen-head" style="margin-top:18px"><span class="kicker">Illustrative demo order</span><h2>Your weekly order is placed</h2><p>The basket has been prepared for retailer fulfilment. No payment was processed.</p></div></section>
    <section class="card"><div class="setting"><div><h4>Delivery date</h4><p>November 2026</p></div><span>${state.date}</span></div><div class="setting"><div><h4>Delivery time</h4><p>Selected window</p></div><span>${state.slot}</span></div><div class="setting"><div><h4>Order coverage</h4><p>${state.profile.goal} plan</p></div><span>${state.selected.length} meals</span></div></section>
    ${deliveryTracking()}
    ${button('Return home','order-home','primary','full')}${button('View basket','back-basket','text','full')}`;
}

function renderProfile(){
  app.innerHTML = head('Preferences and settings','Alex’s profile','The information used to personalise this illustrative plan.') + `
    <section class="card profile-hero"><div class="avatar">AG</div><div><h3 style="margin:0">Alex G.</h3><p class="fine" style="margin:4px 0">Profile complete · consent active</p></div></section>
    <section class="card"><div class="setting"><div><h4>Goal</h4><p>Selected nutrition track</p></div><span>${state.profile.goal}</span></div><div class="setting"><div><h4>Allergies & restrictions</h4><p>Checked in every plan</p></div><span>${state.profile.allergies}</span></div><div class="setting"><div><h4>Foods disliked</h4><p>Excluded from suggestions</p></div><span>${state.profile.dislikes.join(', ')||'None'}</span></div><div class="setting"><div><h4>Household</h4><p>Portion planning</p></div><span>${state.profile.household} people · ${state.profile.servings} servings</span></div><div class="setting"><div><h4>Weekly budget</h4><p>Basket constraint</p></div><span>HK$${state.profile.budget}</span></div><div class="setting"><div><h4>Cooking</h4><p>${state.profile.skill} skill</p></div><span>${state.profile.cookTime}</span></div><div class="setting"><div><h4>Schedule</h4><p>Training and busy days</p></div><span>${state.profile.trainingDays}</span></div></section>
    ${button('Edit full profile','edit-profile','primary','full')}${button(`${aiIcon()} Generate my week`,'generate-week','secondary','full')}
    <section class="card tint"><span class="label">Your control</span><p class="fine" style="font-size:.78rem">Alex must approve substitutions, orders and use of feedback. Clinical nutrition is outside this demo.</p></section>`;
}

function renderCopilot(){
  app.innerHTML=head('Simulated AI workflow','Ask NutriCart','Turn a goal, schedule change or budget constraint into an explainable plan update.')+`
    <section class="copilot-hero"><div class="copilot-orb">✦</div><div><span class="label">NutriCart Copilot</span><h3>What should we plan?</h3><p>Every proposed change stays under your control.</p></div></section>
    <div class="ai-input"><textarea id="copilotInput" aria-label="Ask NutriCart">Create five dinners under HK$500. I train on Tuesday and Thursday, work late Wednesday, and want to gain muscle.</textarea><button data-action="ask-copilot" aria-label="Send to NutriCart">➜</button></div>
    <div class="suggested-prompts">${['Generate my week','I’m eating out Thursday','Optimise my basket','Explain my recommendations'].map((x,i)=>`<button class="prompt-card" data-action="copilot-prompt" data-prompt="${i}"><span>${['✦','↻','▱','?'][i]}</span>${x}</button>`).join('')}</div>
    ${state.aiSummary?aiSummaryCard():`<section class="card tint"><span class="label">How Copilot works</span><div class="ai-checks"><div>✓ Reads Alex’s complete profile</div><div>✓ Connects meals, schedule and basket</div><div>✓ Explains recommendations</div><div>✓ Asks approval before changes</div></div></section>`}`;
}

function aiSummaryCard(){return `<section class="card ai-result"><div class="row between"><span class="label">Copilot result</span><span class="verified">Explainable</span></div><h3>${state.aiSummary.title}</h3><div class="ai-summary-grid"><div><span>●</span><b>${state.selected.length} meals</b><small>Flexible weekly plan</small></div><div><span>◔</span><b>34 g average</b><small>Protein per meal</small></div><div><span>＄</span><b>HK$487</b><small>Within HK$${state.profile.budget}</small></div><div><span>♻</span><b>3 reused</b><small>Shared ingredients</small></div></div><p>${state.aiSummary.copy}</p><div class="button-row">${button('View the plan','go-home','primary')}${button('Open basket','view-basket','secondary')}</div></section>`}

function showAiThinking(mode='generate'){
  const labels=mode==='optimise'?['Combining duplicate ingredients','Deducting pantry items','Finding lower-cost substitutions','Checking meal coverage']:['Interpreting Alex’s goal','Excluding allergies and dislikes','Matching meals to the schedule','Balancing protein and budget','Reducing food waste'];
  modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal ai-thinking"><div class="copilot-orb">✦</div><span class="label">Simulated AI workflow</span><h3>${mode==='optimise'?'Optimising your basket':'Building Alex’s week'}</h3><div class="analysis-list">${labels.map(x=>`<div class="analysis-step"><span class="spinner"></span>${x}</div>`).join('')}</div><p class="fine">NutriCart is connecting profile, schedule, nutrition and basket information.</p></section></div>`;
  setTimeout(()=>mode==='optimise'?showBasketOptimisation():finishAiWeek(),1100)
}

function finishAiWeek(){state.profile.goal='Muscle gain';state.selected=[1,0,6,4,2];state.planReady=true;state.aiSummary={title:'Your five-dinner plan is ready',copy:'I prioritised higher-protein meals on training days, chose a 15-minute option for late Wednesday, avoided peanuts, coriander and mushrooms, and reused broccoli and tofu to reduce waste.'};persistCurrentWeek();closeModal();setScreen('copilot');toast('Copilot created an explainable five-meal week.')}

function openPlanAhead(horizon){const monthly=horizon==='Next month';modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><button class="modal-close" data-modal-close>×</button><div class="copilot-orb">✦</div><span class="label">Plan ahead · simulated AI</span><h3>${monthly?'Create a four-week plan':'Create next week’s plan'}</h3><p>Copilot will reuse Alex’s profile while varying meals, balancing nutrition, checking the HK$${state.profile.budget} weekly budget and preserving flexibility.</p><div class="ai-checks"><div>✓ ${monthly?'Four connected weekly plans':'Five dinners for next week'}</div><div>✓ Training and busy days considered</div><div>✓ Pantry and delivery preferences carried forward</div><div>✓ Every future change remains editable</div></div>${button(monthly?'Generate next month':'Generate next week','confirm-plan-ahead','primary','full')}</section></div>`;bindModal();modalRoot.querySelector('[data-action="confirm-plan-ahead"]').onclick=()=>{modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal ai-thinking"><div class="copilot-orb">✦</div><span class="label">Planning ahead</span><h3>${monthly?'Building four flexible weeks':'Building next week'}</h3><div class="analysis-list">${['Reviewing saved profile','Varying recipes and ingredients','Balancing nutrition and budget','Preparing editable future plans'].map(x=>`<div class="analysis-step"><span class="spinner"></span>${x}</div>`).join('')}</div></section></div>`;setTimeout(()=>{const plans=monthly?[[0,1,6,4,2],[3,5,1,2,4],[6,0,3,5,1],[2,4,0,6,3]]:[[3,1,4,6,0]];plans.forEach((meals,i)=>state.weekPlans[i+1]={meals:[...meals],lastChange:null});state.monthlyWeeks=monthly?4:1;state.monthlyPlans=monthly?plans:[];closeModal();changeViewedWeek(1);toast(`${horizon} is planned and ready to edit.`)},1000)}}

function generateViewedWeek(){const target=state.viewWeekOffset;modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal ai-thinking"><div class="copilot-orb">✦</div><span class="label">Planning ${weekLabel().toLowerCase()}</span><h3>Building an explainable week</h3><div class="analysis-list">${['Loading Alex’s saved profile','Checking this week’s schedule','Balancing meals and budget','Preparing an editable plan'].map(x=>`<div class="analysis-step"><span class="spinner"></span>${x}</div>`).join('')}</div></section></div>`;setTimeout(()=>{const variants=[[0,3,6,4,2],[1,5,3,2,0],[4,6,1,3,2]];state.weekPlans[target]={meals:[...variants[Math.abs(target)%variants.length]],lastChange:null};closeModal();changeViewedWeek(target);toast(`${weekLabel()} was generated with Copilot.`)},900)}

function copyPreviousWeek(){let source=null;for(let offset=state.viewWeekOffset-1;offset>=state.viewWeekOffset-12;offset--){if(state.weekPlans[offset]){source=state.weekPlans[offset];break}}if(!source&&state.selected.length)source={meals:[...state.selected],lastChange:null};if(!source)return toast('No previous plan is available to copy yet.');state.weekPlans[state.viewWeekOffset]={meals:[...source.meals],lastChange:null};changeViewedWeek(state.viewWeekOffset);toast('Previous plan copied. You can edit it independently.')}

function render(){
  if(state.cooking){renderCooking();setActiveNav();bindActions();return}
  ({nutrition:renderNutrition,home:renderHome,meals:renderMeals,copilot:renderCopilot,basket:renderBasket,profile:renderProfile}[state.screen]||renderHome)();setActiveNav();bindActions();
}

function addMeal(){const index=currentSuggestion();if(!state.selected.includes(index))state.selected.push(index);state.suggestionIndex=(index+1)%meals.length;toast(`${state.selected.length} meal${state.selected.length===1?'':'s'} in your basket.`);renderMeals()}
function skipMeal(){const index=currentSuggestion();if(!state.rejected.includes(index))state.rejected.push(index);state.suggestionIndex=(index+1)%meals.length;toast(`${meals[index].name} passed and hidden.`);renderMeals()}
function completePlan(){if(!state.selected.length)return toast('Choose at least one meal first.');state.planReady=true;persistCurrentWeek();renderMeals();modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal celebrate"><div class="celebrate-icon">★</div><span class="label">Week completed</span><h3>Healthy choices, Alex!</h3><p>You selected <strong>${state.selected.length} healthy meal${state.selected.length===1?'':'s'}</strong>. Copilot has prepared the matching grocery basket.</p>${button('View grocery basket','go-complete-basket','primary','full')}${button('View weekly schedule','go-complete-home','secondary','full')}</section></div>`;modalRoot.querySelector('[data-action="go-complete-home"]').onclick=()=>{closeModal();setScreen('home')};modalRoot.querySelector('[data-action="go-complete-basket"]').onclick=()=>{closeModal();setScreen('basket')}}
function bindActions(){}
function handleAction(action,el){
  if(action==='profile')return setScreen('profile');if(action==='choose-meals')return setScreen('meals');if(action==='go-home')return setScreen('home');
  if(action==='add-meal')return addMeal();if(action==='skip-meal')return skipMeal();
  if(action==='why-meal')return openRecipeModal(currentSuggestion());
  if(action==='complete-plan')return completePlan();if(action==='view-basket')return setScreen('basket');
  if(action==='view-selected')return setScreen('basket');if(action==='remove-choice'){state.selected.splice(+el.dataset.index,1);persistCurrentWeek();toast('Meal removed from your week.');return renderBasket()}
  if(action==='generate-week')return showAiThinking('generate');if(action==='optimise-basket')return showAiThinking('optimise');
  if(action==='previous-week')return changeViewedWeek(state.viewWeekOffset-1);if(action==='next-week')return changeViewedWeek(state.viewWeekOffset+1);if(action==='today-week')return changeViewedWeek(0);
  if(action==='generate-current-week')return generateViewedWeek();if(action==='copy-previous-week')return copyPreviousWeek();if(action==='edit-past-plan'){state.editingPast=true;toast('Editing enabled for this past plan.');return renderHome()}
  if(action==='plan-next-week')return openPlanAhead('Next week');if(action==='plan-next-month')return openPlanAhead('Next month');if(action==='select-month-week')return changeViewedWeek(+el.dataset.week)
  if(action==='select-day'){state.activeDay=+el.dataset.index;return renderHome()}if(action==='active-meal-detail'){const idx=state.selected[state.activeDay%state.selected.length];return openMealModal(idx)}
  if(action==='adapt-day')return showAdaptationProposal(state.activeDay);
  if(action==='ask-copilot'){const value=document.querySelector('#copilotInput')?.value.toLowerCase()||'';return value.includes('eating out')?showAdaptationProposal(3):showAiThinking(value.includes('optim')?'optimise':'generate')}
  if(action==='copilot-prompt'){const prompts=['Create five dinners under HK$500 for muscle gain.','I’m eating out on Thursday.','Optimise my basket to reduce cost and waste.','Explain why these meals match my profile.'];const input=document.querySelector('#copilotInput');if(input)input.value=prompts[+el.dataset.prompt];toast('Prompt added. Press send when ready.');return}
  if(action==='qty-up'||action==='qty-down'){const it=state.basket.find(x=>x.id===el.dataset.id);it.qty=Math.max(0,it.qty+(action==='qty-up'?1:-1));return renderBasket()}
  if(action==='remove-item')return removeItem(el.dataset.id);
  if(action==='add-search-item'){const input=document.querySelector('#itemSearch');const name=input.value.trim();if(!name)return toast('Type an item to add.');state.basket.push({id:'custom'+Date.now(),cat:'Added items',icon:'＋',name,note:'Added manually · quantity to confirm',qty:1,source:'Generic item'});toast(`${name} added for review.`);return renderBasket()}
  if(action==='review-order'){state.review=true;return renderBasket()}if(action==='back-basket'){state.review=false;return renderBasket()}
  if(action==='choose-delivery'){if(!state.checks.every(Boolean))return toast('Please complete all three confirmations.');state.review='delivery';return renderBasket()}
  if(action==='select-date'){state.date=el.dataset.value;return renderBasket()}if(action==='select-slot'){state.slot=el.dataset.value;return renderBasket()}
  if(action==='back-review'){state.review=true;return renderBasket()}if(action==='place-order'){state.ordered=true;state.review='confirmed';state.deliveryStage=0;return renderTracking()}
  if(action==='order-home'){state.review=false;return setScreen('home')}if(action==='change-plans'){if(!state.planReady)return toast('Complete the weekly plan first.');if(state.viewWeekOffset<0&&!state.editingPast)return toast('Enable editing before changing a past plan.');return openChangeModal()}
  if(action==='meal-detail'){return openMealModal(+el.dataset.index)}
  if(action==='edit-profile')return openProfileEditor()
  if(action==='track-delivery')return renderTracking();if(action==='tracking-basket'){state.review=false;return renderBasket()}if(action==='advance-tracking'){state.deliveryStage=Math.min(4,state.deliveryStage+1);toast(`Delivery updated: ${['Order confirmed','Picking groceries','Packing','On the way','Delivered'][state.deliveryStage]}.`);return renderTracking()}
  if(action==='exit-cooking'){state.cooking=false;return render()}if(action==='cook-prev'){state.cookStep=Math.max(1,state.cookStep-1);return renderCooking()}if(action==='cook-next'){if(state.cookStep<4){state.cookStep++;return renderCooking()}return renderFeedback()}if(action==='timer'){el.textContent='Running';return toast('Timer started for the demo.')}
  if(action==='save-feedback'){if(!document.querySelector('#feedbackConsent')?.checked)return toast('Please confirm consent before saving.');toast('Feedback saved for next week.');state.cooking=false;return setScreen('home')}
}

function removeItem(id){
  const it=state.basket.find(x=>x.id===id);modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><button class="modal-close" data-modal-close>×</button><span class="label">Plan impact</span><h3>${it.name} supports planned meals</h3><p>This item is used in two planned meals. Would you like to remove it, replace it, or review the affected meals?</p><div class="stack">${button('Find a replacement','replace-item','secondary','full')}${button('Remove anyway','confirm-remove','ghost','full')}${button('Keep item','close-modal','text','full')}</div></section></div>`;bindModal();modalRoot.querySelector('[data-action="confirm-remove"]').onclick=()=>{it.qty=0;closeModal();toast(`${it.name} removed. Plan flagged for recheck.`);renderBasket()};modalRoot.querySelector('[data-action="replace-item"]').onclick=()=>{it.name=`Alternative ${it.name.toLowerCase()}`;it.source='Requires your approval';closeModal();toast('Verified alternative proposed for review.');renderBasket()};
}
function bindModal(){modalRoot.querySelectorAll('[data-modal-close],[data-action="close-modal"]').forEach(x=>x.onclick=closeModal)}
function closeModal(){modalRoot.innerHTML=''}
function infoModal(title,copy){modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><button class="modal-close" data-modal-close>×</button><h3>${title}</h3><p>${copy}</p>${button('Got it','close-modal','primary','full')}</section></div>`;bindModal()}
function recipeDetails(index){
  const details=[
    {ingredients:['Salmon fillet','Jasmine rice','Broccoli','Sesame-lime sauce'],steps:['Cook the rice until fluffy.','Roast the salmon and broccoli for 12–15 minutes.','Serve over rice and spoon over the sesame-lime sauce.']},
    {ingredients:['Chicken breast','Wholewheat noodles','Pak choi','Ginger sauce'],steps:['Boil the noodles for 5 minutes.','Stir-fry chicken until cooked through.','Add vegetables, noodles and ginger sauce; toss for 2 minutes.']},
    {ingredients:['Firm tofu','Mixed vegetables','Brown rice','Low-sodium sauce'],steps:['Pat the tofu dry and cube it.','Stir-fry tofu until golden, then add vegetables.','Add sauce and serve with warm rice.']},
    {ingredients:['Avocado','Free-range eggs','Wholegrain bread','Cherry tomatoes'],steps:['Toast the bread until crisp.','Mash avocado and season lightly.','Top with egg and tomatoes, then serve.']},
    {ingredients:['White fish','Leafy greens','Lemon','Herbs'],steps:['Season fish with lemon and herbs.','Bake for 12 minutes until flaky.','Wilt the greens and serve alongside.']},
    {ingredients:['Chickpeas','Wholewheat pasta','Cherry tomatoes','Spinach'],steps:['Cook the pasta until al dente.','Simmer tomatoes and chickpeas for 10 minutes.','Fold in spinach and toss with pasta.']},
    {ingredients:['Firm tofu','Wholewheat noodles','Mixed vegetables','Approved sauce'],steps:['Cook noodles for 4 minutes.','Stir-fry tofu and vegetables for 5 minutes.','Combine with noodles and divide into two portions.']}
  ];return details[index]||details[0]
}
function openRecipeModal(index){const m=meals[index],d=recipeDetails(index);modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><button class="modal-close" data-modal-close>×</button>${food(m.pos,'cook-hero')}<span class="label">92% AI match · simulated</span><h3>${m.name}</h3><p>${m.kcal} kcal · ${m.protein} g protein · ${m.time} minutes</p><div class="recipe-preview"><h4>Why this meal?</h4><ul><li>Supports ${state.profile.goal.toLowerCase()} with ${m.protein} g protein</li><li>Fits Alex’s ${m.time}-minute cooking window</li><li>Avoids ${state.profile.allergies.toLowerCase()}, ${state.profile.dislikes.join(' and ').toLowerCase()}</li><li>Reuses ingredients already in the weekly basket</li></ul><h4>Ingredients and recipe</h4><ul>${d.ingredients.map(x=>`<li>${x}</li>`).join('')}</ul><h4>Step-by-step cooking instructions</h4><ol>${d.steps.map(x=>`<li>${x}</li>`).join('')}</ol><h4>Suggested substitutions</h4><ul><li>Use tofu instead of fish for a plant-based option</li><li>Use pantry rice to reduce basket cost</li></ul></div>${button('Close recipe','close-modal','primary','full')}</section></div>`;bindModal()}
function openMealModal(index){const m=meals[index];modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><button class="modal-close" data-modal-close>×</button>${food(m.pos,'cook-hero')}<span class="label">Planned meal</span><h3>${m.name}</h3><p>${m.kcal} kcal · ${m.protein} g protein · ${m.time} minutes. Checked against Alex’s no-peanut restriction.</p>${button('View recipe & instructions','view-modal-recipe','secondary','full')}${state.ordered?button('Start cooking','start-cooking','primary','full'):button('Close','close-modal','text','full')}</section></div>`;bindModal();modalRoot.querySelector('[data-action="view-modal-recipe"]').onclick=()=>openRecipeModal(index);const start=modalRoot.querySelector('[data-action="start-cooking"]');if(start)start.onclick=()=>{closeModal();state.cooking=true;state.cookStep=1;render()}}

function openProfileEditor(){const p=state.profile;modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal profile-editor"><button class="modal-close" data-modal-close>×</button><span class="label">Complete profile editor</span><h3>Personalise Alex’s plan</h3><div class="form-grid"><label class="field-label">Nutrition goal<select id="goalInput"><option ${p.goal==='Balanced eating'?'selected':''}>Balanced eating</option><option ${p.goal==='Muscle gain'?'selected':''}>Muscle gain</option><option ${p.goal==='Weight management'?'selected':''}>Weight management</option></select></label><label class="field-label">Allergies<input id="allergiesInput" value="${p.allergies}"></label><label class="field-label">Dietary restrictions<input id="restrictionsInput" value="${p.restrictions}"></label><label class="field-label">Foods disliked<input id="dislikesInput" value="${p.dislikes.join(', ')}"></label><label class="field-label">Household size<input id="householdInput" type="number" min="1" value="${p.household}"></label><label class="field-label">Servings per meal<input id="servingsInput" type="number" min="1" value="${p.servings}"></label><label class="field-label">Weekly budget (HK$)<input id="budgetInput" type="number" min="100" value="${p.budget}"></label><label class="field-label">Available cooking time<input id="cookTimeInput" value="${p.cookTime}"></label><label class="field-label">Cooking skill<select id="skillInput"><option>Beginner</option><option ${p.skill==='Intermediate'?'selected':''}>Intermediate</option><option>Advanced</option></select></label><label class="field-label">Preferred cuisines<input id="cuisinesInput" value="${p.cuisines}"></label><label class="field-label">Training or activity days<input id="trainingInput" value="${p.trainingDays}"></label><label class="field-label">Busy or unavailable days<input id="busyInput" value="${p.busyDays}"></label><label class="field-label">Shopping or delivery days<input id="deliveryDaysInput" value="${p.deliveryDays}"></label><label class="field-label">Pantry ingredients<textarea id="pantryInput">${p.pantry}</textarea></label></div>${button('Save and review AI impact','save-profile','primary','full')}</section></div>`;bindModal();modalRoot.querySelector('[data-action="save-profile"]').onclick=()=>{state.profile={goal:document.querySelector('#goalInput').value,allergies:document.querySelector('#allergiesInput').value,restrictions:document.querySelector('#restrictionsInput').value,dislikes:document.querySelector('#dislikesInput').value.split(',').map(x=>x.trim()).filter(Boolean),household:+document.querySelector('#householdInput').value,servings:+document.querySelector('#servingsInput').value,budget:+document.querySelector('#budgetInput').value,cookTime:document.querySelector('#cookTimeInput').value,skill:document.querySelector('#skillInput').value,cuisines:document.querySelector('#cuisinesInput').value,trainingDays:document.querySelector('#trainingInput').value,busyDays:document.querySelector('#busyInput').value,deliveryDays:document.querySelector('#deliveryDaysInput').value,pantry:document.querySelector('#pantryInput').value};modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><div class="copilot-orb">✦</div><span class="label">Profile updated</span><h3>Recommendations may change</h3><div class="ai-checks"><div>✓ Meal match scores will refresh</div><div>✓ Nutrition targets will rebalance</div><div>✓ Basket quantities may change</div><div>✓ Schedule constraints will be reapplied</div></div>${button('Regenerate with Copilot','regenerate-profile','primary','full')}${button('Keep current plan','close-modal','text','full')}</section></div>`;modalRoot.querySelector('[data-action="regenerate-profile"]').onclick=()=>showAiThinking('generate');bindModal()}}

function deliveryTracking(){return `<section class="card tracking"><div class="row between"><div><span class="label">Delivery tracking</span><h3 style="margin:4px 0 0">Preparing your basket</h3></div><span class="verified">On track</span></div><div class="track-line"><i class="done"></i><i class="done"></i><i></i><i></i></div><div class="track-labels"><span>Confirmed</span><span>Packing</span><span>On the way</span><span>Delivered</span></div><p class="fine">Estimated arrival: ${state.date}, ${state.slot}</p></section>`}

function renderTracking(){const stages=['Order confirmed','Picking groceries','Packing','On the way','Delivered'];app.innerHTML=head('Live order status','Delivery tracking',`Estimated arrival ${state.date}, ${state.slot}`)+`<section class="card tracking-card"><div class="delivery-van">▰</div>${stages.map((x,i)=>`<div class="tracking-step ${i<=state.deliveryStage?'done':''}"><span>${i<state.deliveryStage?'✓':i+1}</span><div><h4>${x}</h4><p>${i===state.deliveryStage?'Current status':i<state.deliveryStage?'Completed':'Waiting'}</p></div></div>`).join('')}</section>${state.deliveryStage<4?button('Advance demo tracking','advance-tracking','primary','full'):button('Delivery complete','order-home','secondary','full')}${button('Back to basket','tracking-basket','text','full')}`;setActiveNav()}

function showBasketOptimisation(){modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><button class="modal-close" data-modal-close>×</button><span class="label">Copilot proposal</span><h3>Save HK$49 and reduce waste</h3><div class="optimise-grid"><div><span>Grocery items</span><b>18 → 14</b></div><div><span>Estimated cost</span><b>HK$536 → HK$487</b></div><div><span>Potential unused</span><b>5 → 1</b></div><div><span>Meals covered</span><b>${state.selected.length} → ${state.selected.length}</b></div></div><div class="change-list"><div class="change-line">Combine broccoli quantities</div><div class="change-line">Use pantry rice and cooking oil</div><div class="change-line">Swap two premium products</div><div class="change-line">Keep every planned meal covered</div></div><p>No basket changes will be made without approval.</p>${button('Approve optimisation','approve-optimisation','primary','full')}${button('Keep current basket','close-modal','text','full')}</section></div>`;bindModal();modalRoot.querySelector('[data-action="approve-optimisation"]').onclick=()=>{state.basketOptimised=true;closeModal();toast('Approved. Basket reduced to 14 items and HK$487.');renderBasket()}}

function showAdaptationProposal(day=state.activeDay){const dayName=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][day];modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><button class="modal-close" data-modal-close>×</button><span class="label">Copilot proposal · ${dayName}</span><h3>Connected plan update</h3><div class="before-after"><div><span>Before</span><b>${dayName} meal scheduled</b><small>HK$487 · ${state.selected.length} meals</small></div><div><span>After</span><b>Meal moved to Friday</b><small>HK$462 · nutrition rebalanced</small></div></div><div class="ai-checks"><div>✓ Grocery quantities adjusted</div><div>✓ One unnecessary ingredient removed</div><div>✓ Restrictions and dislikes preserved</div><div>✓ Delivery slot unchanged</div></div><p class="fine">This is a simulated AI workflow. Review the proposal before applying it.</p>${button('Approve changes','approve-adaptation','primary','full')}${button('Keep original plan','close-modal','text','full')}</section></div>`;bindModal();modalRoot.querySelector('[data-action="approve-adaptation"]').onclick=()=>{state.adapted=true;closeModal();toast(`${dayName} updated across plan and basket.`);render()}}

function openChangeModal(){
  modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><button class="modal-close" data-modal-close>×</button><span class="label">Adaptive planning</span><h3>What changed?</h3><p>Type a note or record a voice message. NutriCart will explain any proposed update before changing the plan.</p><div class="quick-list">${['I’m working late','Less time to cook','I’m eating out','Change my budget'].map(x=>`<button class="chip" data-quick="${x}">${x}</button>`).join('')}</div><div class="voice-box" style="margin-top:12px"><textarea id="changeText">I’m working late on Wednesday and only have 15 minutes to cook.</textarea><div class="voice-row"><span class="fine">Text or voice note</span><button class="mic" id="micBtn" aria-label="Record voice note">●</button></div></div><div style="margin-top:12px">${button('Analyse my change','analyse-change','primary','full')}</div></section></div>`;bindModal();modalRoot.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>document.querySelector('#changeText').value=b.dataset.quick);document.querySelector('#micBtn').onclick=()=>toast('Voice note simulated and transcribed.');document.querySelector('[data-action="analyse-change"]').onclick=analyseChange;
}
function analyseChange(){
  state.pendingChange=document.querySelector('#changeText')?.value.trim()||'I need a faster meal this week.';
  const day=/thurs/i.test(state.pendingChange)?'Thursday':/fri/i.test(state.pendingChange)?'Friday':/sat/i.test(state.pendingChange)?'Saturday':/sun/i.test(state.pendingChange)?'Sunday':/mon/i.test(state.pendingChange)?'Monday':/tues/i.test(state.pendingChange)?'Tuesday':'Wednesday';
  modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><span class="label">NutriCart Copilot is analysing</span><h3>Updating ${day}</h3><div class="analysis-list">${[`Understanding: “${state.pendingChange}”`,`Checking ${day}’s meal`,'Reviewing confirmed pantry','Recalculating nutrition and quantities'].map(x=>`<div class="analysis-step"><span class="spinner"></span>${x}</div>`).join('')}</div><p class="fine">No plan or basket change will be applied without approval.</p></section></div>`;setTimeout(showSuggestion,1000)
}
function showSuggestion(){
  const names=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];const request=state.pendingChange||'I need a faster meal this week.';const target=/thurs/i.test(request)?3:/fri/i.test(request)?4:/sat/i.test(request)?5:/sun/i.test(request)?6:/mon/i.test(request)?0:/tues/i.test(request)?1:2;const day=names[target];const oldIndex=state.selected.length?state.selected[target%state.selected.length]:5;const oldMeal=meals[oldIndex];const replacement=meals[6];
  modalRoot.innerHTML=`<div class="modal-wrap"><section class="modal"><button class="modal-close" data-modal-close>×</button><span class="label">Proposed update · ${day}</span><h3>Your request will change the plan</h3><section class="request-quote">“${request}”</section><div class="compare"><article class="compare-card">${food(oldMeal.pos)}<div class="copy"><span class="label">Before · ${oldMeal.time} min</span><h4>${oldMeal.name}</h4><p>${oldMeal.kcal} kcal · ${oldMeal.protein} g protein</p></div></article><article class="compare-card selected">${food(replacement.pos)}<div class="copy"><span class="label">After · ${replacement.time} min</span><h4>${replacement.name}</h4><p>${replacement.kcal} kcal · ${replacement.protein} g protein</p></div></article></div><div class="change-list"><div class="change-line">${day} meal replaced</div><div class="change-line">Weekly nutrition recalculated</div><div class="change-line">Basket quantities updated</div><div class="change-line">Cooking guidance refreshed</div></div><p class="fine">Approve to make this replacement visible in the weekly plan.</p><div class="stack">${button('Approve and update plan','accept-change','primary','full')}${button('Show another option','another-option','secondary','full')}${button('Keep original meal','close-modal','text','full')}</div></section></div>`;bindModal();document.querySelector('[data-action="accept-change"]').onclick=()=>{if(!state.selected.length)state.selected=[6];else state.selected[target%state.selected.length]=6;if(state.planHorizon==='Next month')state.monthlyPlans[state.activeMonthWeek]=[...state.selected];state.activeDay=target;state.adapted=true;state.lastChange={day,meal:replacement.name,request};closeModal();setScreen('home');toast(`${day} now shows ${replacement.name}.`)};document.querySelector('[data-action="another-option"]').onclick=()=>toast('Another verified option is being prepared.');
}

function renderCooking(){
  const steps=[
    'Bring a small pan of water to the boil. Add the noodles and cook for 4 minutes.',
    'Pat 180 g tofu dry, then slice into bite-sized pieces.',
    'Stir-fry the tofu and vegetables for 5 minutes with the approved sauce.',
    'Drain the noodles, combine everything and divide into two confirmed portions.'
  ];
  const s=state.cookStep;
  app.innerHTML=`<div class="row between" style="margin:5px 0 12px"><button class="btn ghost" data-action="exit-cooking" style="min-height:38px;padding:8px 11px">← Week</button><span class="verified">Validated ingredients</span></div>${food(2,'cook-hero')}<span class="step-count">Step ${s} of ${steps.length}</span><div class="progress" style="margin-top:7px"><i style="width:${s/steps.length*100}%"></i></div><p class="cook-copy">${steps[s-1]}</p><section class="timer"><div><span class="fine" style="color:#d9e6dc">Cooking timer</span><br><b>${s===1?'04:00':'05:00'}</b></div><button data-action="timer">Start</button></section><p class="fine">Instructions use only the ingredients and portions approved in Alex’s plan.</p><div class="button-row">${button('Previous','cook-prev','ghost')}${button(s===steps.length?'Finish meal':'Next step','cook-next','primary')}</div>`;
}
function bindCooking(){}
function renderFeedback(){
  app.innerHTML=head('Meal complete','How did this meal work for you?','Select any feedback that should shape Alex’s next weekly plan.')+`<div class="feedback-grid">${['Cook again','Keep next week','Replace next time','Too much preparation','Portion too small','Portion too large','Ingredient left unused'].map(x=>`<button class="feedback-btn ${state.feedback.includes(x)?'active':''}" data-feedback="${x}">${x}</button>`).join('')}</div><section class="card tint" style="margin-top:14px"><label class="checkline"><input id="feedbackConsent" type="checkbox"><span>Use this feedback to improve my next weekly plan.</span></label></section>${button('Save feedback','save-feedback','primary','full')}`;
}

let actionLocked=false;
app.addEventListener('click',e=>{const feedback=e.target.closest('[data-feedback]');if(feedback){const x=feedback.dataset.feedback;state.feedback=state.feedback.includes(x)?state.feedback.filter(v=>v!==x):[...state.feedback,x];feedback.classList.toggle('active');return}const el=e.target.closest('[data-action]');if(!el||actionLocked)return;actionLocked=true;el.classList.add('is-pressed');try{handleAction(el.dataset.action,el)}finally{setTimeout(()=>{actionLocked=false;el.classList.remove('is-pressed')},180)}});
app.addEventListener('change',e=>{const el=e.target.closest('[data-check]');if(el){state.checks[+el.dataset.check]=el.checked;render()}});
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>setScreen(b.dataset.nav)));
document.querySelector('#helpBtn').addEventListener('click',()=>infoModal('About this demo','This prototype uses illustrative profiles, nutrition values and retailer hand-offs. It does not process payment, provide medical advice or claim measured outcomes.'));
render();
