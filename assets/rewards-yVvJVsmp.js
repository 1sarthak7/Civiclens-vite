import"./global-AF_0RKjy.js";import{g as b,c as o,s as u}from"./notifications-RDF-kLLZ.js";const g={metro:`<svg class="reward-svg reward-svg--metro" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="10" y="8" width="28" height="28" rx="6" class="svg-body"/>
    <circle cx="18" cy="30" r="2.5" class="svg-wheel svg-wheel--left"/>
    <circle cx="30" cy="30" r="2.5" class="svg-wheel svg-wheel--right"/>
    <line x1="14" y1="20" x2="34" y2="20" class="svg-line"/>
    <line x1="24" y1="8" x2="24" y2="20" class="svg-divider"/>
    <line x1="18" y1="36" x2="14" y2="42" class="svg-rail svg-rail--left"/>
    <line x1="30" y1="36" x2="34" y2="42" class="svg-rail svg-rail--right"/>
    <line x1="12" y1="42" x2="36" y2="42" class="svg-track"/>
  </svg>`,electricity:`<svg class="reward-svg reward-svg--electricity" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M28 4L14 26h10l-4 18L34 22H24l4-18z" class="svg-bolt"/>
  </svg>`,water:`<svg class="reward-svg reward-svg--water" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M24 4C24 4 10 20 10 30a14 14 0 0028 0C38 20 24 4 24 4z" class="svg-drop"/>
    <path d="M20 32a6 6 0 004 2" class="svg-shine" opacity="0.6"/>
  </svg>`,gas:`<svg class="reward-svg reward-svg--gas" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="10" y="12" width="20" height="30" rx="4" class="svg-cylinder"/>
    <ellipse cx="20" cy="12" rx="10" ry="4" class="svg-cap"/>
    <path d="M30 20h6a2 2 0 012 2v8a2 2 0 01-2 2h-4" class="svg-nozzle"/>
    <path d="M36 18V10a2 2 0 012-2h2" class="svg-pipe"/>
    <circle cx="40" cy="6" r="2" class="svg-flame"/>
  </svg>`,parking:`<svg class="reward-svg reward-svg--parking" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="4" width="32" height="40" rx="6" class="svg-sign"/>
    <path d="M19 34V14h7a8 8 0 010 16h-7" class="svg-letter"/>
  </svg>`,museum:`<svg class="reward-svg reward-svg--museum" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 18L24 6l20 12" class="svg-roof"/>
    <line x1="6" y1="18" x2="42" y2="18" class="svg-beam"/>
    <line x1="12" y1="18" x2="12" y2="36" class="svg-pillar svg-pillar--1"/>
    <line x1="20" y1="18" x2="20" y2="36" class="svg-pillar svg-pillar--2"/>
    <line x1="28" y1="18" x2="28" y2="36" class="svg-pillar svg-pillar--3"/>
    <line x1="36" y1="18" x2="36" y2="36" class="svg-pillar svg-pillar--4"/>
    <rect x="6" y="36" width="36" height="4" rx="1" class="svg-base"/>
    <circle cx="24" cy="10" r="2" class="svg-gem"/>
  </svg>`},w=[{id:"metro",icon:g.metro,name:"Metro Discount",desc:"₹50 off your next metro recharge. Valid at any metro station counter.",cost:100},{id:"electricity",icon:g.electricity,name:"Electricity Bill Discount",desc:"₹100 off your next electricity bill payment via the official portal.",cost:200},{id:"water",icon:g.water,name:"Water Bill Discount",desc:"₹75 off your next water utility bill. Apply at municipal office.",cost:150},{id:"gas",icon:g.gas,name:"Gas Cylinder Discount",desc:"₹125 off your next gas cylinder booking through authorized dealers.",cost:250},{id:"parking",icon:g.parking,name:"Free Parking Pass",desc:"One-day free municipal parking pass. Valid at any city parking zone.",cost:75},{id:"museum",icon:g.museum,name:"Museum Entry Pass",desc:"Free entry to any government museum in your city for one visit.",cost:50}];let l=null,m=0,v=50;document.addEventListener("DOMContentLoaded",async()=>{if(l=await b(),!l){window.location.href="auth.html";return}_(),await k(),l.role==="authority"?(document.getElementById("citizen-rewards-view")?.classList.add("hidden"),document.getElementById("admin-rewards-view")?.classList.remove("hidden"),await C()):(document.getElementById("citizen-rewards-view")?.classList.remove("hidden"),document.getElementById("admin-rewards-view")?.classList.add("hidden"),await h(),x(),await E(),M())});async function k(){try{const{data:t}=await o.from("reward_config").select("credits_per_resolved").eq("id",1).single();if(t){v=t.credits_per_resolved;const e=document.getElementById("credit-subtext");e&&(e.textContent=`Earn ${v} credits per resolved complaint`)}}catch{console.warn("reward_config not found, using default:",v)}}async function C(){const t=document.getElementById("credits-per-resolved"),e=document.getElementById("current-config-value");t&&(t.value=v),e&&(e.textContent=v),document.getElementById("save-config-btn")?.addEventListener("click",I),await B()}async function I(){const t=document.getElementById("credits-per-resolved"),e=parseInt(t?.value,10);if(!e||e<1||e>1e3){u("Please enter a value between 1 and 1000","error");return}const s=document.getElementById("save-config-btn");s&&(s.disabled=!0);const{error:r}=await o.from("reward_config").update({credits_per_resolved:e,updated_at:new Date().toISOString()}).eq("id",1);if(r)console.error("Config save error:",r),u("Failed to save — have you run the SQL setup?","error");else{v=e;const i=document.getElementById("current-config-value");i&&(i.textContent=e),u(`Credits per resolved set to ${e}`,"success")}s&&(s.disabled=!1)}async function B(){const t=document.getElementById("admin-users-loading"),e=document.getElementById("admin-users-table"),s=document.getElementById("admin-users-body"),{data:r,error:i}=await o.from("profiles").select("id, full_name, role, credits").order("credits",{ascending:!1});if(t&&t.classList.add("hidden"),i||!r){t&&(t.classList.remove("hidden"),t.textContent="Failed to load users");return}e&&e.classList.remove("hidden"),s.innerHTML=r.map(n=>{const a=n.full_name||"Unknown",d=a.split(" ").map(y=>y[0]).join("").substring(0,2).toUpperCase(),c=(n.role||"citizen").charAt(0).toUpperCase()+(n.role||"citizen").slice(1),p=n.credits||0;return`
      <tr>
        <td>
          <div class="admin-user-cell">
            <span class="admin-user-avatar">${d}</span>
            <span>${a}</span>
          </div>
        </td>
        <td><span class="admin-role-badge admin-role-badge--${n.role||"citizen"}">${c}</span></td>
        <td>
          <input type="number" class="admin-credits-input" data-user-id="${n.id}" value="${p}" min="0" />
        </td>
        <td>
          <button class="btn btn-ghost btn-sm admin-save-credits-btn" data-user-id="${n.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Update
          </button>
        </td>
      </tr>
    `}).join(""),s.querySelectorAll(".admin-save-credits-btn").forEach(n=>{n.addEventListener("click",async()=>{const a=n.dataset.userId,d=s.querySelector(`.admin-credits-input[data-user-id="${a}"]`),c=parseInt(d?.value,10);if(isNaN(c)||c<0){u("Invalid credit value","error");return}n.disabled=!0;const{error:p}=await o.from("profiles").update({credits:c}).eq("id",a);if(p){const{error:y}=await o.rpc("award_credits",{target_user_id:a,credit_amount:c-(parseInt(d.defaultValue,10)||0)});y?u("Failed to update credits","error"):(d.defaultValue=c,u("Credits updated!","success"))}else d.defaultValue=c,u("Credits updated!","success");n.disabled=!1})})}function _(){const t=l.full_name||"User",e=document.getElementById("rw-avatar"),s=document.getElementById("rw-name");e&&(e.textContent=t.split(" ").map(r=>r[0]).join("").substring(0,2).toUpperCase()),s&&(s.textContent=t)}async function h(){const{data:t,error:e}=await o.from("profiles").select("credits").eq("id",l.id).single();!e&&t&&(m=t.credits||0);const{count:s}=await o.from("complaints").select("*",{count:"exact",head:!0}).eq("user_id",l.id).eq("status","Resolved"),{data:r}=await o.from("redemptions").select("reward_cost").eq("user_id",l.id),i=r?r.reduce((a,d)=>a+d.reward_cost,0):0,n=m+i;f("credit-balance",m),f("total-earned",n),f("total-redeemed",i),f("total-complaints",s||0)}function f(t,e){const s=document.getElementById(t);if(!s)return;let r=0;const i=1200,n=40,a=e/n,d=i/n,c=setInterval(()=>{r+=a,r>=e&&(r=e,clearInterval(c)),s.textContent=Math.round(r)},d)}function x(){const t=document.getElementById("rewards-grid");t&&(t.innerHTML=w.map(e=>`
    <div class="reward-card" data-reward-id="${e.id}">
      <div class="reward-card-icon">${e.icon}</div>
      <div class="reward-card-name">${e.name}</div>
      <div class="reward-card-desc">${e.desc}</div>
      <div class="reward-card-footer">
        <div class="reward-cost">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
          ${e.cost} credits
        </div>
        <button class="redeem-btn" data-id="${e.id}" ${m<e.cost?"disabled":""}>
          ${m<e.cost?"Not Enough":"Redeem"}
        </button>
      </div>
    </div>
  `).join(""),t.querySelectorAll(".redeem-btn:not([disabled])").forEach(e=>{e.addEventListener("click",()=>L(e.dataset.id))}))}async function L(t){const e=w.find(r=>r.id===t);if(!e)return;if(m<e.cost){u("Not enough credits!","error");return}const s=$(e.id);try{const r=m-e.cost,{error:i}=await o.from("profiles").update({credits:r}).eq("id",l.id);if(i)throw i;const{error:n}=await o.from("redemptions").insert({user_id:l.id,reward_name:e.name,reward_cost:e.cost,coupon_code:s});if(n)throw n;m=r,R(e,s),document.getElementById("credit-balance").textContent=m,x(),await E(),await h()}catch(r){console.error("Redemption error:",r),u(r.message||"Redemption failed","error")}}function $(t){const e=t.toUpperCase().substring(0,3),s=Math.random().toString(36).substring(2,8).toUpperCase();return`CL-${e}-${s}`}async function E(){const{data:t,error:e}=await o.from("redemptions").select("*").eq("user_id",l.id).order("redeemed_at",{ascending:!1}),s=document.getElementById("history-empty"),r=document.getElementById("history-table"),i=document.getElementById("history-body");if(!t||t.length===0){s&&s.classList.remove("hidden"),r&&r.classList.add("hidden");return}s&&s.classList.add("hidden"),r&&r.classList.remove("hidden"),i.innerHTML=t.map(n=>{const a=new Date(n.redeemed_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});return`
      <tr>
        <td>${n.reward_name}</td>
        <td>-${n.reward_cost}</td>
        <td class="coupon-cell">${n.coupon_code}</td>
        <td>${a}</td>
      </tr>
    `}).join("")}function M(){document.getElementById("modal-close-btn")?.addEventListener("click",()=>{document.getElementById("redeem-modal")?.classList.add("hidden")}),document.getElementById("redeem-modal")?.addEventListener("click",t=>{t.target.id==="redeem-modal"&&t.target.classList.add("hidden")})}function R(t,e){const s=document.getElementById("modal-reward-name");s.innerHTML=`<span class="modal-reward-icon">${t.icon}</span> ${t.name}`,document.getElementById("modal-coupon-code").textContent=e,document.getElementById("redeem-modal")?.classList.remove("hidden")}
