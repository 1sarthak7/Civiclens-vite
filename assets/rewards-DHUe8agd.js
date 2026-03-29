import{g as k,s as g}from"./supabase-DAXHF4Ye.js";import{s as v}from"./notifications-C4PrM5w5.js";import{g as C,T as h,R as $}from"./rewardAlgorithm-CExWv0S3.js";const w={metro:`<svg class="reward-svg reward-svg--metro" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
  </svg>`,bus:`<svg class="reward-svg reward-svg--bus" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="6" width="32" height="30" rx="4" class="svg-bus-body"/>
    <line x1="8" y1="18" x2="40" y2="18" class="svg-bus-line"/>
    <line x1="24" y1="6" x2="24" y2="18" class="svg-bus-divider"/>
    <circle cx="16" cy="32" r="3" class="svg-bus-wheel svg-bus-wheel--left"/>
    <circle cx="32" cy="32" r="3" class="svg-bus-wheel svg-bus-wheel--right"/>
    <rect x="12" y="10" width="8" height="6" rx="1" class="svg-bus-window svg-bus-window--1"/>
    <rect x="28" y="10" width="8" height="6" rx="1" class="svg-bus-window svg-bus-window--2"/>
    <line x1="8" y1="38" x2="40" y2="38" class="svg-bus-ground"/>
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
  </svg>`,sports:`<svg class="reward-svg reward-svg--sports" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="24" cy="24" r="16" class="svg-ball"/>
    <ellipse cx="24" cy="24" rx="16" ry="8" class="svg-ball-seam svg-ball-seam--h"/>
    <ellipse cx="24" cy="24" rx="8" ry="16" class="svg-ball-seam svg-ball-seam--v"/>
    <circle cx="24" cy="24" r="4" class="svg-ball-center"/>
  </svg>`,exam:`<svg class="reward-svg reward-svg--exam" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="4" width="26" height="36" rx="2" class="svg-paper"/>
    <line x1="14" y1="12" x2="28" y2="12" class="svg-text-line svg-text-line--1"/>
    <line x1="14" y1="18" x2="28" y2="18" class="svg-text-line svg-text-line--2"/>
    <line x1="14" y1="24" x2="24" y2="24" class="svg-text-line svg-text-line--3"/>
    <path d="M28 28l4 4 8-10" class="svg-checkmark"/>
    <path d="M34 4v8h8" class="svg-fold"/>
  </svg>`,credit:`<svg class="reward-svg reward-svg--credit" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="24" cy="24" r="18" class="svg-coin"/>
    <circle cx="24" cy="24" r="14" class="svg-coin-inner" opacity="0.3"/>
    <path d="M20 18h8a4 4 0 010 8h-8v-8zm0 8h8a4 4 0 010 8h-8" class="svg-symbol" stroke-width="2.5"/>
    <line x1="18" y1="16" x2="18" y2="34" class="svg-symbol-line" stroke-width="2.5"/>
  </svg>`,celebrate:`<svg class="reward-svg reward-svg--celebrate" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 42L18 16l14 14L8 42z" class="svg-cone"/>
    <circle cx="30" cy="10" r="2" class="svg-star svg-star--1"/>
    <circle cx="38" cy="18" r="1.5" class="svg-star svg-star--2"/>
    <circle cx="22" cy="8" r="1.5" class="svg-star svg-star--3"/>
    <circle cx="40" cy="8" r="1" class="svg-star svg-star--4"/>
    <path d="M34 4l1 3 3-1-1 3 3 1-3 1 1 3-3-1-1 3-1-3-3 1 1-3-3-1 3-1-1-3 3 1z" class="svg-sparkle"/>
    <line x1="18" y1="16" x2="14" y2="10" class="svg-confetti svg-confetti--1"/>
    <line x1="20" y1="18" x2="24" y2="8" class="svg-confetti svg-confetti--2"/>
    <line x1="22" y1="22" x2="32" y2="14" class="svg-confetti svg-confetti--3"/>
  </svg>`,gift:`<svg class="reward-svg reward-svg--gift" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="6" y="18" width="36" height="24" rx="3" class="svg-box"/>
    <rect x="4" y="12" width="40" height="8" rx="3" class="svg-lid"/>
    <line x1="24" y1="12" x2="24" y2="42" class="svg-ribbon-v"/>
    <line x1="6" y1="20" x2="42" y2="20" class="svg-ribbon-h" opacity="0"/>
    <path d="M24 12c0 0-4-8-10-8s-4 8 0 8" class="svg-bow svg-bow--left"/>
    <path d="M24 12c0 0 4-8 10-8s4 8 0 8" class="svg-bow svg-bow--right"/>
  </svg>`};let c=null,l=0,p="A";document.addEventListener("DOMContentLoaded",async()=>{if(c=await k(),!c){window.location.href="auth.html";return}M(),c.role==="authority"?(document.getElementById("citizen-rewards-view")?.classList.add("hidden"),document.getElementById("admin-rewards-view")?.classList.remove("hidden"),await B()):(document.getElementById("citizen-rewards-view")?.classList.remove("hidden"),document.getElementById("admin-rewards-view")?.classList.add("hidden"),await x(),E(),f(),await b(),j())});function E(){const e=document.querySelectorAll(".tier-tab");e.forEach(r=>{r.addEventListener("click",()=>{const s=r.dataset.tier;if(s===p)return;e.forEach(i=>i.classList.remove("active")),r.classList.add("active");const t=document.getElementById(`tier-panel-${p}`),a=document.getElementById(`tier-panel-${s}`);t&&(t.classList.remove("active"),t.classList.add("exiting"),setTimeout(()=>t.classList.remove("exiting"),400)),a&&(a.classList.add("entering"),requestAnimationFrame(()=>{a.classList.add("active"),a.classList.remove("entering")})),p=s})})}function f(){["A","B","C"].forEach(e=>{L(e)})}function L(e){const r=document.getElementById(`rewards-grid-${e}`);if(!r)return;const s=h[e],t=C(e);r.innerHTML=t.map(a=>{const i=w[a.iconKey]||w.gift,n=l>=a.cost,o=Math.min(100,Math.round(l/a.cost*100));return`
      <div class="reward-card reward-card--tier-${e}" data-reward-id="${a.id}">
        <div class="reward-card-tier-strip" style="background: linear-gradient(135deg, ${s.gradient[0]}, ${s.gradient[1]})"></div>
        <div class="reward-card-body">
          <div class="reward-card-top">
            <div class="reward-card-icon">${i}</div>
            <span class="reward-tier-badge" style="background: ${s.badgeColor}15; color: ${s.badgeColor}; border: 1px solid ${s.badgeColor}30;">
              Tier ${e}
            </span>
          </div>
          <div class="reward-card-name">${a.name}</div>
          <div class="reward-card-benefit">
            <svg viewBox="0 0 24 24" fill="none" stroke="${s.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ${a.benefit}
          </div>
          <div class="reward-card-desc">${a.desc}</div>
          <div class="reward-card-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${o}%; background: linear-gradient(90deg, ${s.gradient[0]}, ${s.gradient[1]})"></div>
            </div>
            <span class="progress-text">${n?"✓ Affordable":`${l}/${a.cost} credits`}</span>
          </div>
          <div class="reward-card-footer">
            <div class="reward-cost" style="color: ${s.accentColor}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
              ${a.cost} credits
            </div>
            <button class="redeem-btn redeem-btn--tier-${e}" data-id="${a.id}" ${n?"":"disabled"}>
              ${n?"Redeem":"Not Enough"}
            </button>
          </div>
        </div>
      </div>
    `}).join(""),r.querySelectorAll(".redeem-btn:not([disabled])").forEach(a=>{a.addEventListener("click",()=>_(a.dataset.id))})}async function B(){await I()}async function I(){const e=document.getElementById("admin-users-loading"),r=document.getElementById("admin-users-table"),s=document.getElementById("admin-users-body"),{data:t,error:a}=await g.from("profiles").select("id, full_name, role, credits").order("credits",{ascending:!1});if(e&&e.classList.add("hidden"),a||!t){e&&(e.classList.remove("hidden"),e.textContent="Failed to load users");return}r&&r.classList.remove("hidden"),s.innerHTML=t.map(i=>{const n=i.full_name||"Unknown",o=n.split(" ").map(y=>y[0]).join("").substring(0,2).toUpperCase(),d=(i.role||"citizen").charAt(0).toUpperCase()+(i.role||"citizen").slice(1),u=i.credits||0;return`
      <tr>
        <td>
          <div class="admin-user-cell">
            <span class="admin-user-avatar">${o}</span>
            <span>${n}</span>
          </div>
        </td>
        <td><span class="admin-role-badge admin-role-badge--${i.role||"citizen"}">${d}</span></td>
        <td>
          <input type="number" class="admin-credits-input" data-user-id="${i.id}" value="${u}" min="0" />
        </td>
        <td>
          <button class="btn btn-ghost btn-sm admin-save-credits-btn" data-user-id="${i.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Update
          </button>
        </td>
      </tr>
    `}).join(""),s.querySelectorAll(".admin-save-credits-btn").forEach(i=>{i.addEventListener("click",async()=>{const n=i.dataset.userId,o=s.querySelector(`.admin-credits-input[data-user-id="${n}"]`),d=parseInt(o?.value,10);if(isNaN(d)||d<0){v("Invalid credit value","error");return}i.disabled=!0;const{error:u}=await g.from("profiles").update({credits:d}).eq("id",n);if(u){const{error:y}=await g.rpc("award_credits",{target_user_id:n,credit_amount:d-(parseInt(o.defaultValue,10)||0)});y?v("Failed to update credits","error"):(o.defaultValue=d,v("Credits updated!","success"))}else o.defaultValue=d,v("Credits updated!","success");i.disabled=!1})})}function M(){const e=c.full_name||"User",r=document.getElementById("rw-avatar"),s=document.getElementById("rw-name");r&&(r.textContent=e.split(" ").map(t=>t[0]).join("").substring(0,2).toUpperCase()),s&&(s.textContent=e)}async function x(){const{data:e,error:r}=await g.from("profiles").select("credits").eq("id",c.id).single();!r&&e&&(l=e.credits||0);const{count:s}=await g.from("complaints").select("*",{count:"exact",head:!0}).eq("user_id",c.id).eq("status","Resolved"),{data:t}=await g.from("redemptions").select("reward_cost").eq("user_id",c.id),a=t?t.reduce((n,o)=>n+o.reward_cost,0):0,i=l+a;m("credit-balance",l),m("total-earned",i),m("total-redeemed",a),m("total-complaints",s||0)}function m(e,r){const s=document.getElementById(e);if(!s)return;let t=0;const a=1200,i=40,n=r/i,o=a/i,d=setInterval(()=>{t+=n,t>=r&&(t=r,clearInterval(d)),s.textContent=Math.round(t)},o)}async function _(e){const r=$.find(t=>t.id===e);if(!r)return;if(l<r.cost){v("Not enough credits!","error");return}const s=T(r);try{const t=l-r.cost,{error:a}=await g.from("profiles").update({credits:t}).eq("id",c.id);if(a)throw a;const{error:i}=await g.from("redemptions").insert({user_id:c.id,reward_name:r.name,reward_cost:r.cost,coupon_code:s,reward_tier:r.tier});if(i)throw i;l=t,A(r,s),document.getElementById("credit-balance").textContent=l,f(),await b(),await x()}catch(t){console.error("Redemption error:",t),v(t.message||"Redemption failed","error")}}function T(e){const r=e.tier,s=e.id.toUpperCase().substring(0,3),t=Math.random().toString(36).substring(2,8).toUpperCase();return`CL-${r}-${s}-${t}`}async function b(){const{data:e,error:r}=await g.from("redemptions").select("*").eq("user_id",c.id).order("redeemed_at",{ascending:!1}),s=document.getElementById("history-empty"),t=document.getElementById("history-table"),a=document.getElementById("history-body");if(!e||e.length===0){s&&s.classList.remove("hidden"),t&&t.classList.add("hidden");return}s&&s.classList.add("hidden"),t&&t.classList.remove("hidden"),a.innerHTML=e.map(i=>{const n=new Date(i.redeemed_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),o=i.reward_tier||"–",d=h[o];return`
      <tr>
        <td><span class="history-tier-badge" style="${d?`background: ${d.badgeColor}15; color: ${d.badgeColor}; border: 1px solid ${d.badgeColor}30;`:"background: rgba(107,114,128,0.1); color: #6b7280;"}">Tier ${o}</span></td>
        <td>${i.reward_name}</td>
        <td>-${i.reward_cost}</td>
        <td class="coupon-cell">${i.coupon_code}</td>
        <td>${n}</td>
      </tr>
    `}).join("")}function j(){document.getElementById("modal-close-btn")?.addEventListener("click",()=>{document.getElementById("redeem-modal")?.classList.add("hidden")}),document.getElementById("redeem-modal")?.addEventListener("click",e=>{e.target.id==="redeem-modal"&&e.target.classList.add("hidden")})}function A(e,r){const s=h[e.tier],t=w[e.iconKey]||w.gift,a=document.getElementById("modal-reward-name");a.innerHTML=`<span class="modal-reward-icon">${t}</span> ${e.name}`;const i=document.getElementById("modal-tier-badge");i&&(i.innerHTML=`<span class="reward-tier-badge" style="background: ${s.badgeColor}15; color: ${s.badgeColor}; border: 1px solid ${s.badgeColor}30;">
      ${s.icon} Tier ${e.tier} — ${s.name}
    </span>`),document.getElementById("modal-coupon-code").textContent=r,document.getElementById("redeem-modal")?.classList.remove("hidden")}
