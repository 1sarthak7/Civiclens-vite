import{g as E,s as m}from"./supabase-DAXHF4Ye.js";import{s as g}from"./notifications-C4PrM5w5.js";const u={metro:`<svg class="reward-svg reward-svg--metro" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
  </svg>`},f=[{id:"metro",icon:u.metro,name:"Metro Discount",desc:"₹50 off your next metro recharge. Valid at any metro station counter.",cost:100},{id:"electricity",icon:u.electricity,name:"Electricity Bill Discount",desc:"₹100 off your next electricity bill payment via the official portal.",cost:200},{id:"water",icon:u.water,name:"Water Bill Discount",desc:"₹75 off your next water utility bill. Apply at municipal office.",cost:150},{id:"gas",icon:u.gas,name:"Gas Cylinder Discount",desc:"₹125 off your next gas cylinder booking through authorized dealers.",cost:250},{id:"parking",icon:u.parking,name:"Free Parking Pass",desc:"One-day free municipal parking pass. Valid at any city parking zone.",cost:75},{id:"museum",icon:u.museum,name:"Museum Entry Pass",desc:"Free entry to any government museum in your city for one visit.",cost:50}];let c=null,l=0;document.addEventListener("DOMContentLoaded",async()=>{if(c=await E(),!c){window.location.href="auth.html";return}C(),c.role==="authority"?(document.getElementById("citizen-rewards-view")?.classList.add("hidden"),document.getElementById("admin-rewards-view")?.classList.remove("hidden"),await k()):(document.getElementById("citizen-rewards-view")?.classList.remove("hidden"),document.getElementById("admin-rewards-view")?.classList.add("hidden"),await w(),h(),await x(),L())});async function k(){await b()}async function b(){const t=document.getElementById("admin-users-loading"),e=document.getElementById("admin-users-table"),n=document.getElementById("admin-users-body"),{data:s,error:a}=await m.from("profiles").select("id, full_name, role, credits").order("credits",{ascending:!1});if(t&&t.classList.add("hidden"),a||!s){t&&(t.classList.remove("hidden"),t.textContent="Failed to load users");return}e&&e.classList.remove("hidden"),n.innerHTML=s.map(r=>{const i=r.full_name||"Unknown",d=i.split(" ").map(y=>y[0]).join("").substring(0,2).toUpperCase(),o=(r.role||"citizen").charAt(0).toUpperCase()+(r.role||"citizen").slice(1),p=r.credits||0;return`
      <tr>
        <td>
          <div class="admin-user-cell">
            <span class="admin-user-avatar">${d}</span>
            <span>${i}</span>
          </div>
        </td>
        <td><span class="admin-role-badge admin-role-badge--${r.role||"citizen"}">${o}</span></td>
        <td>
          <input type="number" class="admin-credits-input" data-user-id="${r.id}" value="${p}" min="0" />
        </td>
        <td>
          <button class="btn btn-ghost btn-sm admin-save-credits-btn" data-user-id="${r.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Update
          </button>
        </td>
      </tr>
    `}).join(""),n.querySelectorAll(".admin-save-credits-btn").forEach(r=>{r.addEventListener("click",async()=>{const i=r.dataset.userId,d=n.querySelector(`.admin-credits-input[data-user-id="${i}"]`),o=parseInt(d?.value,10);if(isNaN(o)||o<0){g("Invalid credit value","error");return}r.disabled=!0;const{error:p}=await m.from("profiles").update({credits:o}).eq("id",i);if(p){const{error:y}=await m.rpc("award_credits",{target_user_id:i,credit_amount:o-(parseInt(d.defaultValue,10)||0)});y?g("Failed to update credits","error"):(d.defaultValue=o,g("Credits updated!","success"))}else d.defaultValue=o,g("Credits updated!","success");r.disabled=!1})})}function C(){const t=c.full_name||"User",e=document.getElementById("rw-avatar"),n=document.getElementById("rw-name");e&&(e.textContent=t.split(" ").map(s=>s[0]).join("").substring(0,2).toUpperCase()),n&&(n.textContent=t)}async function w(){const{data:t,error:e}=await m.from("profiles").select("credits").eq("id",c.id).single();!e&&t&&(l=t.credits||0);const{count:n}=await m.from("complaints").select("*",{count:"exact",head:!0}).eq("user_id",c.id).eq("status","Resolved"),{data:s}=await m.from("redemptions").select("reward_cost").eq("user_id",c.id),a=s?s.reduce((i,d)=>i+d.reward_cost,0):0,r=l+a;v("credit-balance",l),v("total-earned",r),v("total-redeemed",a),v("total-complaints",n||0)}function v(t,e){const n=document.getElementById(t);if(!n)return;let s=0;const a=1200,r=40,i=e/r,d=a/r,o=setInterval(()=>{s+=i,s>=e&&(s=e,clearInterval(o)),n.textContent=Math.round(s)},d)}function h(){const t=document.getElementById("rewards-grid");t&&(t.innerHTML=f.map(e=>`
    <div class="reward-card" data-reward-id="${e.id}">
      <div class="reward-card-icon">${e.icon}</div>
      <div class="reward-card-name">${e.name}</div>
      <div class="reward-card-desc">${e.desc}</div>
      <div class="reward-card-footer">
        <div class="reward-cost">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
          ${e.cost} credits
        </div>
        <button class="redeem-btn" data-id="${e.id}" ${l<e.cost?"disabled":""}>
          ${l<e.cost?"Not Enough":"Redeem"}
        </button>
      </div>
    </div>
  `).join(""),t.querySelectorAll(".redeem-btn:not([disabled])").forEach(e=>{e.addEventListener("click",()=>B(e.dataset.id))}))}async function B(t){const e=f.find(s=>s.id===t);if(!e)return;if(l<e.cost){g("Not enough credits!","error");return}const n=I(e.id);try{const s=l-e.cost,{error:a}=await m.from("profiles").update({credits:s}).eq("id",c.id);if(a)throw a;const{error:r}=await m.from("redemptions").insert({user_id:c.id,reward_name:e.name,reward_cost:e.cost,coupon_code:n});if(r)throw r;l=s,$(e,n),document.getElementById("credit-balance").textContent=l,h(),await x(),await w()}catch(s){console.error("Redemption error:",s),g(s.message||"Redemption failed","error")}}function I(t){const e=t.toUpperCase().substring(0,3),n=Math.random().toString(36).substring(2,8).toUpperCase();return`CL-${e}-${n}`}async function x(){const{data:t,error:e}=await m.from("redemptions").select("*").eq("user_id",c.id).order("redeemed_at",{ascending:!1}),n=document.getElementById("history-empty"),s=document.getElementById("history-table"),a=document.getElementById("history-body");if(!t||t.length===0){n&&n.classList.remove("hidden"),s&&s.classList.add("hidden");return}n&&n.classList.add("hidden"),s&&s.classList.remove("hidden"),a.innerHTML=t.map(r=>{const i=new Date(r.redeemed_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});return`
      <tr>
        <td>${r.reward_name}</td>
        <td>-${r.reward_cost}</td>
        <td class="coupon-cell">${r.coupon_code}</td>
        <td>${i}</td>
      </tr>
    `}).join("")}function L(){document.getElementById("modal-close-btn")?.addEventListener("click",()=>{document.getElementById("redeem-modal")?.classList.add("hidden")}),document.getElementById("redeem-modal")?.addEventListener("click",t=>{t.target.id==="redeem-modal"&&t.target.classList.add("hidden")})}function $(t,e){const n=document.getElementById("modal-reward-name");n.innerHTML=`<span class="modal-reward-icon">${t.icon}</span> ${t.name}`,document.getElementById("modal-coupon-code").textContent=e,document.getElementById("redeem-modal")?.classList.remove("hidden")}
