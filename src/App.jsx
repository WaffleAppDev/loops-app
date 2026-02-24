import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const timeAgo = ts => {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

const randomColor = () => ["#00f5c4","#f500c4","#f5a000","#00c4f5","#c4f500"][Math.floor(Math.random()*5)];
const initials = name => name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "??";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
:root{
  --bg:#07070f;--bg2:#0f0f1e;--bg3:#16162a;--card:#111120;
  --border:#1c1c33;--neon:#00f5c4;--neon2:#f500c4;--neon3:#f5a000;
  --text:#eeeeff;--muted:#5a5a88;--radius:18px;
  --safe-top:env(safe-area-inset-top,44px);
  --safe-bot:env(safe-area-inset-bottom,34px);
  --nav-h:calc(56px + env(safe-area-inset-bottom,34px));
}
html{height:-webkit-fill-available;}
html,body{height:100%;background:#000;overscroll-behavior:none;}
body{font-family:'Syne',sans-serif;color:var(--text);-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;}
#root{height:100%;height:-webkit-fill-available;}

/* ── SHELL: flex column, nav at bottom as flex child, NOT absolute ── */
.shell{
  width:100%;max-width:430px;
  height:100svh;
  height:-webkit-fill-available;
  margin:0 auto;
  background:var(--bg);
  display:flex;flex-direction:column;
  overflow:hidden;
  position:relative;
}
.status-bar{height:var(--safe-top);min-height:44px;flex-shrink:0;}

/* screens take remaining space above nav */
.screen{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;animation:fadeUp .28s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.scroll-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:1.5rem;}
.scroll-body::-webkit-scrollbar{display:none;}

.page-hdr{padding:.85rem 1.25rem .6rem;display:flex;align-items:center;justify-content:space-between;background:rgba(7,7,15,.9);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-bottom:1px solid var(--border);flex-shrink:0;}
.page-hdr-title{font-size:1.4rem;font-weight:800;letter-spacing:-.02em;}
.page-hdr-title span{color:var(--neon);}

/* ── NAV BAR: flex child at bottom, NOT absolute ── */
.nav-bar{
  flex-shrink:0;
  width:100%;
  background:rgba(7,7,15,.97);
  backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);
  border-top:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-around;
  padding:.5rem 0 env(safe-area-inset-bottom,20px);
  z-index:100;
}
.nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:none;background:none;cursor:pointer;font-family:'Syne',sans-serif;font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);transition:color .2s;padding:.3rem .5rem;min-height:52px;justify-content:center;}
.nav-btn.active{color:var(--neon);}
.nav-btn svg{width:23px;height:23px;}
.nav-pip{width:4px;height:4px;border-radius:50%;background:var(--neon);margin-top:1px;}
.nav-center{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;border:none;background:none;cursor:pointer;padding:.3rem .5rem;font-family:'Syne',sans-serif;font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);transition:color .2s;min-height:52px;justify-content:center;}
.loop-in-icon{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--neon),#00b8ff);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(0,245,196,.5);transition:transform .18s,box-shadow .18s;}
.loop-in-icon:active{transform:scale(.92);}
.loop-in-icon svg{width:22px;height:22px;color:#000;}
.av{border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-weight:700;border:1.5px solid rgba(255,255,255,.08);flex-shrink:0;}
.av-sm{width:32px;height:32px;font-size:.58rem;}
.av-md{width:40px;height:40px;font-size:.7rem;}
.av-xl{width:72px;height:72px;font-size:1.1rem;}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
.vc{margin:0 1rem .75rem;cursor:pointer;transition:transform .15s;}
.vc:active{transform:scale(.985);}
.vc-thumb{width:100%;height:205px;position:relative;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#0e0e1a 0%,#003a30 60%,#00f5c4 100%);}
.play-ring{width:54px;height:54px;border-radius:50%;background:rgba(0,245,196,.1);backdrop-filter:blur(12px);border:2px solid var(--neon);display:flex;align-items:center;justify-content:center;box-shadow:0 0 28px rgba(0,245,196,.35);transition:transform .15s;}
.vc:hover .play-ring{transform:scale(1.08);}
.play-ring svg{width:22px;height:22px;color:var(--neon);margin-left:2px;}
.dur-badge{position:absolute;bottom:.6rem;right:.6rem;background:rgba(0,0,0,.65);backdrop-filter:blur(8px);padding:.2rem .48rem;border-radius:6px;font-size:.66rem;font-family:'Space Mono',monospace;}
.exp-badge{position:absolute;top:.6rem;right:.6rem;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);padding:.18rem .45rem;border-radius:6px;font-size:.6rem;font-family:'Space Mono',monospace;color:var(--muted);}
.vc-body{padding:.82rem .9rem;}
.vc-meta{display:flex;align-items:center;gap:.48rem;margin-bottom:.42rem;}
.vc-uploader{font-size:.78rem;font-weight:700;}
.vc-time{font-size:.66rem;color:var(--muted);font-family:'Space Mono',monospace;margin-left:auto;}
.vc-title{font-size:.96rem;font-weight:700;margin-bottom:.62rem;line-height:1.3;}
.vc-actions{display:flex;gap:.9rem;align-items:center;}
.act-btn{display:flex;align-items:center;gap:.36rem;border:none;background:none;cursor:pointer;color:var(--muted);font-family:'Syne',sans-serif;font-size:.78rem;font-weight:600;transition:color .15s;padding:.28rem 0;}
.act-btn svg{width:18px;height:18px;transition:transform .15s;}
.act-btn:active svg{transform:scale(1.2);}
.act-btn.liked{color:var(--neon2);}
.group-pill{font-size:.62rem;color:var(--neon);background:rgba(0,245,196,.08);padding:.14rem .48rem;border-radius:20px;font-family:'Space Mono',monospace;}
.gc{margin:0 1rem .65rem;padding:1rem;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.gc::after{content:'›';position:absolute;right:1rem;top:50%;transform:translateY(-50%);color:var(--muted);font-size:1.3rem;}
.gc:active{transform:scale(.985);}
.gc-top{display:flex;align-items:center;gap:.7rem;margin-bottom:.65rem;}
.gc-emoji{font-size:1.85rem;line-height:1;}
.gc-name{font-size:.93rem;font-weight:700;}
.gc-sub{font-size:.68rem;color:var(--muted);font-family:'Space Mono',monospace;margin-top:2px;}
.av-stack{display:flex;}
.av-stack .av{margin-left:-8px;border:2px solid var(--card);}
.av-stack .av:first-child{margin-left:0;}
.sched-chip{display:inline-flex;align-items:center;gap:.38rem;font-size:.66rem;font-family:'Space Mono',monospace;color:var(--muted);background:var(--bg2);padding:.28rem .65rem;border-radius:20px;border:1px solid var(--border);}
.btn{border:none;border-radius:12px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:700;transition:all .18s;display:inline-flex;align-items:center;justify-content:center;gap:.38rem;padding:.72rem 1.25rem;font-size:.88rem;}
.btn:active{transform:scale(.96);}
.btn-p{background:var(--neon);color:#000;}
.btn-g{background:var(--bg3);color:var(--text);border:1px solid var(--border);}
.btn-sm{padding:.42rem .82rem;font-size:.78rem;border-radius:9px;}
.btn-ico{padding:.45rem;border-radius:10px;}
.btn-ico svg{width:16px;height:16px;}
.lbl{font-size:.62rem;font-weight:700;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;font-family:'Space Mono',monospace;margin-bottom:.48rem;}
input{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:.78rem 1rem;color:var(--text);font-family:'Syne',sans-serif;font-size:1rem;outline:none;transition:border-color .2s;-webkit-appearance:none;border-radius:12px;}
input:focus{border-color:var(--neon);}
input::placeholder{color:var(--muted);}
.modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:flex-end;}
.modal{background:var(--bg2);border-radius:24px 24px 0 0;width:100%;max-height:92vh;overflow-y:auto;padding:0 1.4rem calc(var(--safe-bot)+1.2rem);display:flex;flex-direction:column;gap:1rem;}
.modal::-webkit-scrollbar{display:none;}
.modal-grab{width:36px;height:4px;background:var(--border);border-radius:2px;margin:.75rem auto 0;}
.modal-hdr{display:flex;align-items:center;justify-content:space-between;padding-top:.2rem;}
.modal-title{font-size:1.15rem;font-weight:800;}
.modal-tabs{display:flex;background:var(--bg3);border-radius:11px;padding:4px;gap:4px;}
.m-tab{flex:1;padding:.56rem;text-align:center;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:700;transition:all .2s;color:var(--muted);border:none;background:none;}
.m-tab.active{background:var(--neon);color:#000;}
.grp-sel-list{display:flex;flex-direction:column;gap:.42rem;}
.grp-sel-item{display:flex;align-items:center;gap:.75rem;padding:.72rem .9rem;border-radius:12px;border:1px solid var(--border);background:var(--bg3);cursor:pointer;transition:all .2s;width:100%;}
.grp-sel-item.sel{border-color:var(--neon);background:rgba(0,245,196,.05);}
.grp-sel-nm{font-size:.88rem;font-weight:700;font-family:'Syne',sans-serif;color:var(--text);}
.upload-zone{border:2px dashed var(--border);border-radius:16px;padding:2rem;display:flex;flex-direction:column;align-items:center;gap:.65rem;cursor:pointer;transition:all .2s;background:var(--bg3);}
.upload-zone.has-file{border-color:var(--neon);background:rgba(0,245,196,.04);}
.upload-icon{font-size:2.2rem;}
.upload-hint{font-size:.66rem;color:var(--muted);font-family:'Space Mono',monospace;}
.drw-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:flex-end;}
.drw{background:var(--bg2);border-radius:22px 22px 0 0;width:100%;max-height:80vh;display:flex;flex-direction:column;padding:0 1.1rem calc(var(--safe-bot)+1rem);}
.drw-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:.75rem auto .6rem;}
.drw-title{font-size:1rem;font-weight:800;margin-bottom:.75rem;}
.cmts-list{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:.6rem;padding-bottom:.5rem;}
.cmts-list::-webkit-scrollbar{display:none;}
.cmt{display:flex;gap:.65rem;align-items:flex-start;}
.cmt-bubble{background:var(--bg3);border-radius:12px;padding:.62rem .82rem;flex:1;}
.cmt-author{font-size:.72rem;font-weight:700;margin-bottom:.22rem;}
.cmt-text{font-size:.84rem;line-height:1.45;}
.cmt-t{font-size:.6rem;color:var(--muted);font-family:'Space Mono',monospace;margin-top:.3rem;}
.cmt-input-row{display:flex;align-items:center;gap:.6rem;margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--border);}
.sec-lbl{font-size:.58rem;font-weight:700;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;font-family:'Space Mono',monospace;padding:.75rem 1.15rem .4rem;}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.85rem;padding:3.5rem 2rem;text-align:center;color:var(--muted);}
.empty-icon{font-size:2.8rem;}
.empty p{font-size:.85rem;line-height:1.6;}
.cam-screen{position:fixed;inset:0;background:#000;z-index:300;display:flex;flex-direction:column;justify-content:space-between;}
.cam-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.cam-top{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:calc(env(safe-area-inset-top,44px) + .8rem) 1.2rem .8rem;}
.cam-bot{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem calc(env(safe-area-inset-bottom,34px) + 1.4rem);}
.cam-close-btn{width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.5);backdrop-filter:blur(10px);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.cam-close-btn svg{width:17px;height:17px;}
.cam-flip-btn{width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.5);backdrop-filter:blur(10px);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .3s;}
.cam-flip-btn svg{width:18px;height:18px;}
.cam-flip-btn:disabled{opacity:.35;}
.rec-btn-wrap{display:flex;flex-direction:column;align-items:center;gap:.5rem;}
.rec-btn{width:72px;height:72px;border-radius:50%;border:3.5px solid rgba(255,255,255,.85);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s;}
.rec-btn:active{transform:scale(.93);}
.rec-inner{width:52px;height:52px;border-radius:50%;background:#f55050;box-shadow:0 0 20px rgba(245,80,80,.5);transition:all .22s;}
.rec-inner.recording{border-radius:8px;width:30px;height:30px;}
.rec-inner.paused{border-radius:50%;width:52px;height:52px;border:3px solid rgba(255,255,255,.6);background:transparent;}
.rec-label{font-size:.62rem;color:rgba(255,255,255,.65);font-family:'Space Mono',monospace;text-align:center;height:1rem;}
.pause-resume-btn{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border:1.5px solid rgba(255,255,255,.25);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.pause-resume-btn svg{width:18px;height:18px;}
.pause-resume-btn.resume{background:rgba(0,245,196,.2);border-color:var(--neon);color:var(--neon);}
.rec-timer{position:fixed;top:calc(env(safe-area-inset-top,44px) + 4.2rem);left:50%;transform:translateX(-50%);background:rgba(0,0,0,.65);backdrop-filter:blur(10px);padding:.32rem .85rem;border-radius:20px;font-size:.72rem;font-family:'Space Mono',monospace;font-weight:700;color:#fff;z-index:311;display:flex;align-items:center;gap:.48rem;}
.rec-dot{width:7px;height:7px;border-radius:50%;background:#fff;animation:blink 1s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.rec-timer.paused-state{background:rgba(245,165,0,.88);}
.rec-timer.paused-state .rec-dot{animation:none;}
.seg-bar{position:fixed;top:calc(env(safe-area-inset-top,44px) + 3.6rem);left:1.2rem;right:1.2rem;height:3px;background:rgba(255,255,255,.12);border-radius:2px;overflow:hidden;z-index:311;display:flex;gap:2px;}
.seg-fill{height:100%;border-radius:2px;}
.dur-warn{position:fixed;bottom:calc(env(safe-area-inset-bottom,34px) + 9rem);left:50%;transform:translateX(-50%);background:rgba(245,165,0,.92);color:#000;padding:.32rem .9rem;border-radius:20px;font-size:.7rem;font-family:'Space Mono',monospace;font-weight:700;white-space:nowrap;z-index:311;animation:fadeUp .3s ease;}
.no-cam-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;background:#000;z-index:8;}
.sched-panel{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:.9rem 1rem;margin:.75rem 1rem;}
.sched-panel-title{font-size:.58rem;font-weight:700;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;font-family:'Space Mono',monospace;margin-bottom:.62rem;}
.rot-item{display:flex;align-items:center;gap:.58rem;padding:.42rem .48rem;border-radius:9px;transition:background .15s;}
.rot-item.cur{background:rgba(0,245,196,.07);border:1px solid rgba(0,245,196,.14);}
.rot-lbl{font-size:.66rem;font-family:'Space Mono',monospace;color:var(--muted);margin-right:auto;text-transform:capitalize;}
.cur-tag{font-size:.58rem;background:var(--neon);color:#000;padding:.12rem .4rem;border-radius:4px;font-weight:700;font-family:'Space Mono',monospace;}
.gd-hdr{padding:1.15rem;background:radial-gradient(ellipse at 50% 0%,rgba(0,245,196,.07) 0%,transparent 65%),var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;}
.back-btn{display:flex;align-items:center;gap:.32rem;border:none;background:none;color:var(--neon);cursor:pointer;font-family:'Syne',sans-serif;font-size:.8rem;font-weight:700;margin-bottom:.88rem;padding:0;}
.back-btn svg{width:17px;height:17px;}
.gd-name{font-size:1.5rem;font-weight:800;margin-bottom:.18rem;}
.gd-code{font-family:'Space Mono',monospace;font-size:.66rem;color:var(--muted);background:var(--bg3);padding:.2rem .52rem;border-radius:6px;display:inline-block;letter-spacing:.1em;}
.prof-hero{padding:1.9rem 1.25rem 1.4rem;background:radial-gradient(ellipse at 50% 0%,rgba(0,245,196,.09) 0%,transparent 65%),var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:.65rem;}
.prof-name{font-size:1.3rem;font-weight:800;}
.prof-un{font-size:.74rem;font-family:'Space Mono',monospace;color:var(--muted);}
.prof-stats{display:flex;gap:2.2rem;margin-top:.45rem;}
.stat{text-align:center;}
.stat-v{font-size:1.25rem;font-weight:800;color:var(--neon);}
.stat-l{font-size:.58rem;color:var(--muted);font-family:'Space Mono',monospace;letter-spacing:.08em;}
.auth-screen{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2rem;padding:2.5rem 1.75rem;background:radial-gradient(ellipse at 20% 85%,rgba(0,245,196,.09) 0%,transparent 55%),radial-gradient(ellipse at 80% 15%,rgba(245,0,196,.09) 0%,transparent 55%),var(--bg);}
.logo-ring{width:76px;height:76px;border-radius:50%;border:2px solid var(--neon);display:flex;align-items:center;justify-content:center;box-shadow:0 0 35px rgba(0,245,196,.45),inset 0 0 20px rgba(0,245,196,.06);animation:pulse-ring 2.8s ease-in-out infinite;}
@keyframes pulse-ring{0%,100%{box-shadow:0 0 35px rgba(0,245,196,.45)}50%{box-shadow:0 0 55px rgba(0,245,196,.75)}}
.logo-ring::after{content:'∞';font-size:2.1rem;color:var(--neon);font-family:'Space Mono',monospace;}
.logo-name{font-size:2.3rem;font-weight:800;letter-spacing:-.02em;}
.logo-tag{font-size:.7rem;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;font-family:'Space Mono',monospace;}
.auth-tabs{display:flex;background:var(--bg2);border-radius:11px;padding:4px;}
.a-tab{flex:1;padding:.56rem;text-align:center;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:700;transition:all .2s;color:var(--muted);border:none;background:none;}
.a-tab.active{background:var(--neon);color:#000;}
.notif-item{display:flex;align-items:flex-start;gap:.68rem;padding:.82rem 1.1rem;border-bottom:1px solid var(--border);}
.notif-dot{width:8px;height:8px;border-radius:50%;background:var(--neon);margin-top:.34rem;flex-shrink:0;}
.notif-txt{font-size:.82rem;line-height:1.5;}
.notif-time{font-size:.62rem;color:var(--muted);font-family:'Space Mono',monospace;margin-top:.2rem;}
.emoji-row{display:flex;gap:.38rem;flex-wrap:wrap;}
.emo-btn{font-size:1.4rem;background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:.28rem .43rem;cursor:pointer;transition:all .15s;}
.emo-btn.active{border-color:var(--neon);background:rgba(0,245,196,.08);}
.toast{position:fixed;top:calc(var(--safe-top) + .7rem);left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid var(--neon);border-radius:12px;padding:.62rem 1.2rem;font-size:.8rem;font-weight:700;color:var(--neon);z-index:999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,245,196,.2);animation:toastIn .3s ease;pointer-events:none;}
.hide-scroll{-ms-overflow-style:none;scrollbar-width:none;}
.hide-scroll::-webkit-scrollbar{display:none;}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes flamePulse{0%,100%{filter:drop-shadow(0 0 6px rgba(245,160,0,.6))}50%{filter:drop-shadow(0 0 14px rgba(245,160,0,.95))}}
.loading-screen{height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);flex-direction:column;gap:1rem;}
.spinner{width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--neon);border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.err-msg{color:#f55050;font-size:.78rem;font-family:'Space Mono',monospace;text-align:center;padding:.5rem;background:rgba(245,80,80,.08);border:1px solid rgba(245,80,80,.2);border-radius:8px;}
`;

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ic = {
  Feed: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>,
  LoopIn: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12C2 6.477 6.477 2 12 2c3.314 0 6.285 1.506 8.293 3.868"/><path d="M22 12c0 5.523-4.477 10-10 10-3.314 0-6.285-1.506-8.293-3.868"/><polyline points="17.5 2 20.5 5.5 17 7.5"/><polyline points="6.5 22 3.5 18.5 7 16.5"/></svg>,
  Me: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>,
  Heart: ({ filled }) => filled ? <svg viewBox="0 0 24 24" fill="#f500c4" stroke="#f500c4" strokeWidth={1.5}><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg> : <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>,
  Chat: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  Play: () => <svg fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>,
  Back: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>,
  X: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
  Copy: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 4h12v4"/></svg>,
  Flip: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>,
  Pause: () => <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>,
  Resume: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
};

function useStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch{} };
  }, []);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  useStyles();
  const [session, setSession]         = useState(null);
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [groups, setGroups]           = useState([]);
  const [usersMap, setUsersMap]       = useState({});
  const [tab, setTab]                 = useState("feed");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeGroupId, setActiveGroupId] = useState("all");
  const [commentsVideo, setCommentsVideo] = useState(null);
  const [showLoopIn, setShowLoopIn]   = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCamera, setShowCamera]   = useState(false);
  const [recordedCover, setRecordedCover] = useState(null);
  const [recordedBlob, setRecordedBlob]   = useState(null);
  const [toast, setToast]             = useState(null);
  const [newComment, setNewComment]   = useState("");
  const [notifs, setNotifs]           = useState([]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2600); };
  const unread = notifs.filter(n => !n.read).length;

  // ── AUTH LISTENER ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  // ── LOAD GROUPS ──
  useEffect(() => {
    if (!profile) return;
    loadGroups();
  }, [profile]);

  const loadGroups = async () => {
    // Get groups the user belongs to
    const { data: memberRows } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", profile.id);

    if (!memberRows?.length) { setGroups([]); return; }

    const groupIds = memberRows.map(r => r.group_id);

    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds);

    if (!groupData) return;

    // For each group load members + videos
    const enriched = await Promise.all(groupData.map(async g => {
      const { data: members } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, username, full_name, avatar_color)")
        .eq("group_id", g.id);

      const { data: videos } = await supabase
        .from("videos")
        .select("*, likes(user_id), comments(id, user_id, text, created_at, profiles(full_name, avatar_color))")
        .eq("group_id", g.id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      // Build local users map
      const newUsers = {};
      members?.forEach(m => {
        if (m.profiles) newUsers[m.profiles.id] = {
          id: m.profiles.id,
          name: m.profiles.full_name || m.profiles.username,
          username: m.profiles.username,
          avatar: initials(m.profiles.full_name || m.profiles.username),
          color: m.profiles.avatar_color || "#00f5c4",
        };
      });
      setUsersMap(prev => ({ ...prev, ...newUsers }));

      const normalizedVideos = (videos || []).map(v => ({
        id: v.id,
        userId: v.user_id,
        groupId: v.group_id,
        title: v.title || "Untitled Loop",
        videoUrl: v.video_url,
        coverUrl: v.cover_url,
        duration: v.duration || "—",
        uploadedAt: new Date(v.created_at).getTime(),
        likes: (v.likes || []).map(l => l.user_id),
        comments: (v.comments || []).map(c => ({
          id: c.id,
          userId: c.user_id,
          text: c.text,
          ts: new Date(c.created_at).getTime(),
        })),
      }));

      return {
        id: g.id,
        name: g.name,
        emoji: g.emoji || "🎬",
        code: g.code,
        adminId: g.admin_id,
        scheduleMode: g.schedule_mode || "rotation",
        streak: g.streak || 0,
        createdAt: new Date(g.created_at).getTime(),
        members: (members || []).map(m => m.user_id),
        videos: normalizedVideos,
      };
    }));

    setGroups(enriched);
  };

  // ── TOGGLE LIKE ──
  const toggleLike = async (groupId, videoId) => {
    const video = groups.flatMap(g => g.videos).find(v => v.id === videoId);
    if (!video) return;
    const alreadyLiked = video.likes.includes(profile.id);

    // Optimistic update
    setGroups(gs => gs.map(g => g.id !== groupId ? g : {
      ...g, videos: g.videos.map(v => v.id !== videoId ? v : {
        ...v, likes: alreadyLiked ? v.likes.filter(id => id !== profile.id) : [...v.likes, profile.id]
      })
    }));

    if (alreadyLiked) {
      await supabase.from("likes").delete().eq("video_id", videoId).eq("user_id", profile.id);
    } else {
      await supabase.from("likes").insert({ video_id: videoId, user_id: profile.id });
    }
  };

  // ── ADD COMMENT ──
  const addComment = async (groupId, videoId, text) => {
    if (!text.trim()) return;
    const { data } = await supabase.from("comments")
      .insert({ video_id: videoId, user_id: profile.id, text: text.trim() })
      .select()
      .single();
    if (!data) return;
    const c = { id: data.id, userId: profile.id, text: data.text, ts: new Date(data.created_at).getTime() };
    setGroups(gs => gs.map(g => g.id !== groupId ? g : {
      ...g, videos: g.videos.map(v => v.id !== videoId ? v : { ...v, comments: [...v.comments, c] })
    }));
    setCommentsVideo(cv => cv ? { ...cv, comments: [...cv.comments, c] } : cv);
  };

  // ── UPLOAD VIDEO ──
  const uploadVideo = async (groupId, title, videoBlob, coverBlob) => {
    showToast("Uploading...");
    let videoUrl = null, coverUrl = null;

    if (videoBlob) {
      const ext = videoBlob.type?.includes("mp4") ? "mp4" : "webm";
      const path = `${groupId}/${Date.now()}.${ext}`;
      console.log("Uploading video:", path, videoBlob.type, videoBlob.size);
      const { data, error } = await supabase.storage
        .from("videos")
        .upload(path, videoBlob, { contentType: videoBlob.type || "video/mp4" });
      console.log("Video upload result:", data, error);
      if (data) videoUrl = supabase.storage.from("videos").getPublicUrl(data.path).data.publicUrl;
    }

    if (coverBlob) {
      const path = `${groupId}/${Date.now()}.jpg`;
      const { data } = await supabase.storage.from("covers").upload(path, coverBlob);
      if (data) coverUrl = supabase.storage.from("covers").getPublicUrl(data.path).data.publicUrl;
    }

    await supabase.from("videos").insert({
      group_id: groupId, user_id: profile.id,
      title: title || "Untitled Loop",
      video_url: videoUrl, cover_url: coverUrl,
    });

    showToast("Loop posted! 🎉");
    setNotifs(n => [{ id: `n${Date.now()}`, text: `You posted a new Loop! 🎉`, time: Date.now(), read: false }, ...n]);
    loadGroups();
  };

  // ── CREATE GROUP ──
  const createGroup = async ({ name, emoji, scheduleMode }) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data: g } = await supabase.from("groups")
      .insert({ name, emoji, code, admin_id: profile.id, schedule_mode: scheduleMode })
      .select().single();
    if (!g) return;
    await supabase.from("group_members").insert({ group_id: g.id, user_id: profile.id });
    showToast(`${name} created!`);
    loadGroups();
  };

  // ── JOIN GROUP ──
  const joinGroup = async (code) => {
    const { data: g } = await supabase.from("groups").select("*").eq("code", code.toUpperCase()).single();
    if (!g) { showToast("Group not found!"); return; }
    const { data: existing } = await supabase.from("group_members")
      .select("*").eq("group_id", g.id).eq("user_id", profile.id).single();
    if (existing) { showToast("Already in this group!"); return; }
    await supabase.from("group_members").insert({ group_id: g.id, user_id: profile.id });
    showToast(`Joined ${g.name}!`);
    loadGroups();
  };

  // ── LEAVE GROUP ──
  const leaveGroup = async (groupId) => {
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", profile.id);
    setSelectedGroup(null);
    showToast("Left group.");
    loadGroups();
  };

  // ── UPDATE GROUP ──
  const updateGroup = async (g) => {
    await supabase.from("groups").update({ schedule_mode: g.scheduleMode }).eq("id", g.id);
    setGroups(gs => gs.map(x => x.id === g.id ? g : x));
    if (selectedGroup?.id === g.id) setSelectedGroup(g);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setGroups([]); setProfile(null); setNotifs([]);
  };

  if (loading) return (
    <div className="loading-screen" style={{background:"var(--bg)"}}>
      <div className="logo-ring" style={{marginBottom:".5rem"}}/>
      <div className="spinner"/>
    </div>
  );

  if (!session || !profile) return <AuthScreen />;

  const myGroups = groups;
  const allVideos = myGroups.flatMap(g => g.videos.map(v => ({ ...v, group: g }))).sort((a, b) => b.uploadedAt - a.uploadedAt);

  return (
    <div className="shell">
      <div className="status-bar"/>
      {toast && <div className="toast">✓ {toast}</div>}

      {showCamera && (
        <CameraScreen
          onClose={() => setShowCamera(false)}
          onUseVideo={(cover, blob) => { setShowCamera(false); setRecordedCover(cover); setRecordedBlob(blob); setShowLoopIn(true); }}
        />
      )}

      {commentsVideo && (
        <div className="drw-overlay" onClick={e => e.target === e.currentTarget && setCommentsVideo(null)}>
          <div className="drw">
            <div className="drw-handle"/>
            <div className="drw-title">Comments · {commentsVideo.comments.length}</div>
            <div className="cmts-list">
              {commentsVideo.comments.length === 0 && <div style={{color:"var(--muted)",fontSize:".83rem",textAlign:"center",padding:"2rem 0"}}>No comments yet — be first!</div>}
              {commentsVideo.comments.map(c => (
                <div className="cmt" key={c.id}>
                  <div className="av av-sm" style={{background:(usersMap[c.userId]?.color||"#00f5c4")+"22",color:usersMap[c.userId]?.color||"#00f5c4"}}>{usersMap[c.userId]?.avatar||"??"}</div>
                  <div className="cmt-bubble">
                    <div className="cmt-author" style={{color:usersMap[c.userId]?.color||"#00f5c4"}}>{usersMap[c.userId]?.name||"User"}</div>
                    <div className="cmt-text">{c.text}</div>
                    <div className="cmt-t">{timeAgo(c.ts)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cmt-input-row">
              <div className="av av-sm" style={{background:profile.avatar_color+"22",color:profile.avatar_color}}>{initials(profile.full_name||profile.username)}</div>
              <input placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { addComment(commentsVideo.groupId, commentsVideo.id, newComment); setNewComment(""); }}}/>
              <button className="btn btn-p btn-sm" onClick={() => { addComment(commentsVideo.groupId, commentsVideo.id, newComment); setNewComment(""); }}>↑</button>
            </div>
          </div>
        </div>
      )}

      {showLoopIn && (
        <LoopInModal groups={myGroups}
          onClose={() => { setShowLoopIn(false); setRecordedCover(null); setRecordedBlob(null); }}
          onRecord={() => { setShowLoopIn(false); setShowCamera(true); }}
          onUpload={(gid, title, videoBlob, coverBlob) => { uploadVideo(gid, title, videoBlob, coverBlob); setShowLoopIn(false); setRecordedCover(null); setRecordedBlob(null); }}
          recordedCoverPhoto={recordedCover}
          recordedVideoBlob={recordedBlob}
        />
      )}

      {showGroupModal && (
        <GroupModal
          onClose={() => setShowGroupModal(false)}
          onCreate={createGroup}
          onJoin={joinGroup}
        />
      )}

      {selectedGroup ? (
        <GroupDetailScreen
          group={selectedGroup} users={usersMap} currentUser={{...profile, id: profile.id, avatar: initials(profile.full_name||profile.username), color: profile.avatar_color||"#00f5c4"}}
          onBack={() => setSelectedGroup(null)}
          onToggleLike={toggleLike}
          onOpenComments={v => setCommentsVideo(v)}
          onShowToast={showToast}
          onUpdateGroup={updateGroup}
          onLeaveGroup={leaveGroup}
        />
      ) : (
        <>
          {tab === "feed" && (
            <div className="screen">
              <div className="page-hdr">
                <div className="page-hdr-title">your <span>feed</span></div>
                <button className="btn btn-g btn-sm" onClick={() => setShowGroupModal(true)} style={{display:"flex",alignItems:"center",gap:".28rem",padding:".4rem .68rem",fontSize:".7rem"}}>
                    <span style={{fontSize:".9rem"}}>＋</span> Group
                  </button>
              </div>

              <div style={{display:"flex",gap:".5rem",padding:".65rem 1rem .55rem",overflowX:"auto",flexShrink:0,background:"rgba(7,7,15,.92)",borderBottom:"1px solid var(--border)"}} className="hide-scroll">
                <button onClick={() => setActiveGroupId("all")} style={{flexShrink:0,display:"flex",alignItems:"center",gap:".4rem",padding:".42rem .85rem",borderRadius:20,border:"none",cursor:"pointer",background:activeGroupId==="all"?"var(--neon)":"var(--bg3)",color:activeGroupId==="all"?"#000":"var(--muted)",fontFamily:"Syne",fontSize:".76rem",fontWeight:700,transition:"all .2s",boxShadow:activeGroupId==="all"?"0 0 12px rgba(0,245,196,.35)":"none"}}>
                  All Loops
                </button>
                {myGroups.map(g => {
                  const active = activeGroupId === g.id;
                  return (
                    <button key={g.id}
                      onClick={() => { if (activeGroupId === g.id) setSelectedGroup(g); else setActiveGroupId(g.id); }}
                      style={{flexShrink:0,display:"flex",alignItems:"center",gap:".38rem",padding:".42rem .85rem",borderRadius:20,border:"none",cursor:"pointer",background:active?"var(--neon)":"var(--bg3)",color:active?"#000":"var(--text)",fontFamily:"Syne",fontSize:".76rem",fontWeight:700,transition:"all .2s",boxShadow:active?"0 0 12px rgba(0,245,196,.35)":"none"}}>
                      <span style={{fontSize:"1rem",lineHeight:1}}>{g.emoji}</span>
                      {g.name}
                      {(g.streak||0)>0 && <span style={{fontSize:".62rem",fontFamily:"Space Mono",fontWeight:700,color:active?"#000":"var(--neon3)"}}>🔥{g.streak}</span>}
                    </button>
                  );
                })}
              </div>

              <div className="scroll-body">
                {(() => {
                  const filtered = activeGroupId === "all" ? allVideos : allVideos.filter(v => v.groupId === activeGroupId);
                  if (filtered.length === 0) return <div className="empty"><span className="empty-icon">🎬</span><p>No Loops yet.<br/>Tap Loop In to post first!</p></div>;
                  return filtered.map(v => (
                    <VideoCard key={v.id} video={v} users={usersMap} currentUser={{...profile, id:profile.id}}
                      showGroup={activeGroupId === "all"}
                      onToggleLike={() => toggleLike(v.groupId, v.id)}
                      onOpenComments={() => setCommentsVideo(v)}/>
                  ));
                })()}
              </div>
            </div>
          )}

          {tab === "me" && (
            <MeScreen
              profile={profile} groups={myGroups}
              videos={allVideos} notifs={notifs} unread={unread}
              onMarkRead={() => setNotifs(n => n.map(x => ({...x, read: true})))}
              onLogout={handleLogout}
            />
          )}
        </>
      )}

      {!selectedGroup && !showCamera && (
        <nav className="nav-bar">
          <button className={`nav-btn ${tab==="feed"?"active":""}`} onClick={() => setTab("feed")}>
            <Ic.Feed/> Feed {tab==="feed"&&<div className="nav-pip"/>}
          </button>
          <button className="nav-center" onClick={() => setShowLoopIn(true)}>
            <div className="loop-in-icon"><Ic.LoopIn/></div>
            <span>Loop In</span>
          </button>
          <button className={`nav-btn ${tab==="me"?"active":""}`} onClick={() => setTab("me")}>
            <div style={{position:"relative",display:"inline-flex"}}>
              <Ic.Me/>
              {unread>0&&<div style={{position:"absolute",top:-2,right:-2,width:8,height:8,borderRadius:"50%",background:"var(--neon2)",border:"2px solid var(--bg)"}}/>}
            </div>
            Me {tab==="me"&&<div className="nav-pip"/>}
          </button>
        </nav>
      )}
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [verified, setVerified] = useState(false);

  // Detect when user lands back after clicking verification email link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token") || hash.includes("type=signup")) {
      setVerified(true);
      setMode("login");
      // Clear the hash from URL
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const submit = async () => {
    setError(""); setLoading(true);

    if (mode === "signup") {
      if (!email || !password || !username) {
        setError("Please fill in all fields.");
        setLoading(false); return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false); return;
      }
      const { data, error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr) { setError(authErr.message); setLoading(false); return; }

      // Save profile details to localStorage so we can create it after verification
      localStorage.setItem("pending_profile", JSON.stringify({
        id: data.user.id,
        username: username.toLowerCase().replace(/\s/g, ""),
        full_name: name || username,
      }));

      setMode("check_email");
      setLoading(false);
      return;
    }

    // Sign in
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      if (authErr.message.toLowerCase().includes("email")) {
        setError("Please verify your email first — check your inbox.");
      } else {
        setError("Incorrect email or password.");
      }
      setLoading(false); return;
    }

    // Create profile if it doesn't exist yet (first login after verification)
    if (data?.user) {
      const { data: existing } = await supabase.from("profiles").select("id").eq("id", data.user.id).single();
      if (!existing) {
        const pending = JSON.parse(localStorage.getItem("pending_profile") || "{}");
        const colors = ["#00f5c4","#f500c4","#f5a000","#00c4f5","#c4f500"];
        await supabase.from("profiles").insert({
          id: data.user.id,
          username: pending.username || email.split("@")[0],
          full_name: pending.full_name || email.split("@")[0],
          avatar_color: colors[Math.floor(Math.random() * colors.length)],
        });
        localStorage.removeItem("pending_profile");
      }
    }

    setLoading(false);
    // Auth listener in App will pick up the session and redirect automatically
  };

  // ── CHECK EMAIL SCREEN ──
  if (mode === "check_email") {
    return (
      <div className="auth-screen">
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".48rem"}}>
          <div className="logo-ring"/>
          <div className="logo-name">Loops</div>
        </div>
        <div style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.2rem",textAlign:"center"}}>
          <div style={{fontSize:"3.5rem"}}>📬</div>
          <div>
            <div style={{fontSize:"1.2rem",fontWeight:800,marginBottom:".5rem"}}>Check your email</div>
            <div style={{fontSize:".82rem",color:"var(--muted)",fontFamily:"Space Mono",lineHeight:1.7}}>
              We sent a verification link to<br/>
              <span style={{color:"var(--neon)",fontWeight:700}}>{email}</span>
            </div>
          </div>
          <div style={{fontSize:".75rem",color:"var(--muted)",lineHeight:1.8,background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:14,padding:"1rem 1.2rem"}}>
            1. Open the email from Supabase<br/>
            2. Click the confirmation link<br/>
            3. Come back here and sign in
          </div>
          <button className="btn btn-p" style={{width:"100%"}} onClick={() => setMode("login")}>
            I verified my email — Sign In →
          </button>
          <button className="btn btn-g" style={{width:"100%",fontSize:".8rem"}} onClick={() => setMode("signup")}>
            ← Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".48rem"}}>
        <div className="logo-ring"/>
        <div className="logo-name">Loops</div>
        <div className="logo-tag">share your world, on repeat</div>
      </div>

      {verified && (
        <div style={{width:"100%",background:"rgba(0,245,196,.08)",border:"1px solid rgba(0,245,196,.3)",borderRadius:12,padding:".85rem 1rem",textAlign:"center"}}>
          <div style={{fontSize:"1.1rem",marginBottom:".2rem"}}>✅ Email verified!</div>
          <div style={{fontSize:".72rem",color:"var(--muted)",fontFamily:"Space Mono"}}>You can now sign in below.</div>
        </div>
      )}

      <div style={{width:"100%",display:"flex",flexDirection:"column",gap:".65rem"}}>
        <div className="auth-tabs">
          <button className={`a-tab ${mode==="login"?"active":""}`} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
          <button className={`a-tab ${mode==="signup"?"active":""}`} onClick={() => { setMode("signup"); setError(""); }}>Sign Up</button>
        </div>
        {mode === "signup" && <>
          <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)}/>
          <input placeholder="Username (no spaces)" value={username} onChange={e => setUsername(e.target.value)}/>
        </>}
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}/>
        <input placeholder="Password (min 6 characters)" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter"&&submit()}/>
        {error && <div className="err-msg">{error}</div>}
        <button className="btn btn-p" onClick={submit} style={{width:"100%"}} disabled={loading}>
          {loading ? "..." : mode==="login" ? "Sign In →" : "Create Account →"}
        </button>
      </div>
    </div>
  );
}

// ─── VIDEO CARD ───────────────────────────────────────────────────────────────
function VideoCard({ video, users, currentUser, onToggleLike, onOpenComments, showGroup }) {
  const up = users[video.userId];
  const liked = video.likes.includes(currentUser.id);
  const daysLeft = Math.max(0, 7 - Math.floor((Date.now() - video.uploadedAt) / 86400000));
  return (
    <div className="vc card">
      <div className="vc-thumb" style={{background: video.coverUrl ? `url(${video.coverUrl}) center/cover` : "linear-gradient(160deg,#0e0e1a 0%,#003a30 60%,#00f5c4 100%)"}}>
        <div className="play-ring"><Ic.Play/></div>
        <div className="dur-badge">{video.duration}</div>
        <div className="exp-badge">{daysLeft}d left</div>
      </div>
      <div className="vc-body">
        <div className="vc-meta">
          <div className="av av-sm" style={{background:(up?.color||"#00f5c4")+"22",color:up?.color||"#00f5c4"}}>{up?.avatar||"??"}</div>
          <span className="vc-uploader">{up?.name||"User"}</span>
          {showGroup&&video.group&&<span className="group-pill">{video.group.emoji} {video.group.name}</span>}
          <span className="vc-time">{timeAgo(video.uploadedAt)}</span>
        </div>
        <div className="vc-title">{video.title}</div>
        <div className="vc-actions">
          <button className={`act-btn ${liked?"liked":""}`} onClick={onToggleLike}><Ic.Heart filled={liked}/>{video.likes.length}</button>
          <button className="act-btn" onClick={onOpenComments}><Ic.Chat/>{video.comments.length}</button>
        </div>
      </div>
    </div>
  );
}

// ─── GROUP CARD ───────────────────────────────────────────────────────────────
function GroupCard({ group, users, onClick }) {
  return (
    <div className="gc card" onClick={onClick}>
      <div className="gc-top">
        <span className="gc-emoji">{group.emoji}</span>
        <div>
          <div className="gc-name">{group.name}</div>
          <div className="gc-sub">{group.members.length} members · {group.videos.length} Loops</div>
        </div>
        <div style={{marginLeft:"auto",paddingRight:"1.1rem"}}>
          <div className="av-stack">
            {group.members.slice(0,3).map(id => (
              <div key={id} className="av av-sm" style={{background:(users[id]?.color||"#00f5c4")+"22",color:users[id]?.color||"#00f5c4",width:26,height:26,fontSize:".5rem"}}>{users[id]?.avatar||"??"}</div>
            ))}
          </div>
        </div>
      </div>
      <span className="sched-chip">⏱ {group.scheduleMode}</span>
    </div>
  );
}

// ─── GROUP DETAIL SCREEN ──────────────────────────────────────────────────────
function GroupDetailScreen({ group, users, currentUser, onBack, onToggleLike, onOpenComments, onShowToast, onUpdateGroup, onLeaveGroup }) {
  const isAdmin = group.adminId === currentUser.id;
  const [showScheduleEdit, setShowScheduleEdit] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editMode, setEditMode] = useState(group.scheduleMode);
  const daysOld = Math.floor((Date.now() - (group.createdAt || Date.now())) / 86400000);
  const streak = group.streak || 0;

  const scheduleOptions = [
    { id:"rotation", icon:"🔄", label:"Daily Rotation", desc:"Next person each day" },
    { id:"assigned", icon:"📅", label:"Assigned Days",  desc:"Each member gets a day" },
    { id:"same",     icon:"👥", label:"Same Day",       desc:"Everyone posts together" },
  ];

  const shareInvite = () => {
    const text = `Join my group "${group.name}" on Loops! Use code: ${group.code}`;
    if (navigator.share) navigator.share({ title:"Join my Loops Group", text }).catch(()=>{});
    else { navigator.clipboard?.writeText(text); onShowToast("Invite copied!"); }
  };

  return (
    <div className="screen">
      {showScheduleEdit && (
        <div className="modal-ov" onClick={e=>e.target===e.currentTarget&&setShowScheduleEdit(false)}>
          <div className="modal">
            <div className="modal-grab"/>
            <div className="modal-hdr">
              <div><div className="modal-title">Upload Schedule</div><div style={{fontSize:".7rem",color:"var(--muted)",fontFamily:"Space Mono",marginTop:".1rem"}}>Admin only</div></div>
              <button className="btn btn-g btn-sm btn-ico" onClick={()=>setShowScheduleEdit(false)}><Ic.X/></button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
              {scheduleOptions.map(m=>(
                <button key={m.id} onClick={()=>setEditMode(m.id)} style={{display:"flex",alignItems:"center",gap:".85rem",padding:".75rem .9rem",borderRadius:13,border:`1.5px solid ${editMode===m.id?"var(--neon)":"var(--border)"}`,background:editMode===m.id?"rgba(0,245,196,.06)":"var(--bg3)",cursor:"pointer",textAlign:"left",width:"100%"}}>
                  <span style={{fontSize:"1.4rem"}}>{m.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".88rem",fontWeight:700,color:editMode===m.id?"var(--neon)":"var(--text)",fontFamily:"Syne"}}>{m.label}</div>
                    <div style={{fontSize:".65rem",color:"var(--muted)",fontFamily:"Space Mono"}}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button className="btn btn-p" style={{width:"100%"}} onClick={()=>{onUpdateGroup({...group,scheduleMode:editMode});setShowScheduleEdit(false);}}>Save Changes</button>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="drw-overlay" onClick={e=>e.target===e.currentTarget&&setShowInvite(false)}>
          <div className="drw">
            <div className="drw-handle"/>
            <div className="drw-title">Invite to {group.name}</div>
            <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:14,padding:"1.2rem",textAlign:"center",marginBottom:".5rem"}}>
              <div style={{fontSize:".62rem",color:"var(--muted)",fontFamily:"Space Mono",letterSpacing:".12em",marginBottom:".5rem"}}>GROUP CODE</div>
              <div style={{fontSize:"2rem",fontWeight:800,fontFamily:"Space Mono",letterSpacing:".2em",color:"var(--neon)"}}>{group.code}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".6rem"}}>
              {[
                {icon:"📋",label:"Copy Code",action:()=>{navigator.clipboard?.writeText(group.code);onShowToast("Code copied!");}},
                {icon:"💬",label:"Send Text",action:()=>window.open(`sms:?body=Join "${group.name}" on Loops! Code: ${group.code}`)},
                {icon:"🔗",label:"Copy Link",action:()=>{navigator.clipboard?.writeText(`Join "${group.name}" on Loops — code: ${group.code}`);onShowToast("Link copied!");}},
                {icon:"⬆️",label:"Share",action:shareInvite},
              ].map(opt=>(
                <button key={opt.label} onClick={opt.action} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".4rem",padding:".9rem .5rem",borderRadius:13,border:"1px solid var(--border)",background:"var(--bg3)",cursor:"pointer"}}>
                  <span style={{fontSize:"1.5rem"}}>{opt.icon}</span>
                  <span style={{fontSize:".75rem",fontWeight:700}}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="gd-hdr">
        <button className="back-btn" onClick={onBack}><Ic.Back/>Feed</button>
        <div style={{display:"flex",alignItems:"center",gap:".7rem",marginBottom:".85rem"}}>
          <span style={{fontSize:"2.4rem"}}>{group.emoji}</span>
          <div style={{flex:1}}>
            <div className="gd-name">{group.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:".5rem",marginTop:".2rem"}}>
              <span className="gd-code">CODE: {group.code}</span>
              {isAdmin&&<span style={{fontSize:".58rem",background:"rgba(245,160,0,.12)",color:"var(--neon3)",border:"1px solid rgba(245,160,0,.25)",padding:".12rem .4rem",borderRadius:4,fontFamily:"Space Mono",fontWeight:700}}>ADMIN</span>}
            </div>
          </div>
          <button onClick={()=>setShowInvite(true)} style={{padding:".5rem .75rem",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg3)",cursor:"pointer",display:"flex",alignItems:"center",gap:".35rem",fontSize:".72rem",fontWeight:700,fontFamily:"Syne"}}>＋ Invite</button>
        </div>

        <div style={{background:streak>=7?"linear-gradient(135deg,rgba(245,160,0,.18),rgba(245,85,85,.12))":"rgba(245,160,0,.08)",border:`1px solid ${streak>=7?"rgba(245,160,0,.4)":"rgba(245,160,0,.2)"}`,borderRadius:14,padding:".75rem 1rem",display:"flex",alignItems:"center",gap:".75rem",marginBottom:".85rem"}}>
          <div style={{fontSize:streak>=7?"2rem":"1.6rem",filter:streak>=7?"drop-shadow(0 0 8px rgba(245,160,0,.7))":"none",animation:streak>=7?"flamePulse 1.8s ease-in-out infinite":"none"}}>🔥</div>
          <div style={{flex:1}}>
            <div style={{fontSize:streak>=7?"1.1rem":".95rem",fontWeight:800,color:streak>=7?"var(--neon3)":"var(--text)"}}>{streak} day streak</div>
            <div style={{fontSize:".65rem",color:"var(--muted)",fontFamily:"Space Mono",marginTop:".18rem"}}>
              {streak===0?"Post today to start your streak!":streak<7?"Keep going — don't break the chain!":streak<30?"You're on fire! 🏆":"Legendary streak! 🌟"}
            </div>
          </div>
          {streak>=7&&<div style={{background:"rgba(245,160,0,.2)",border:"1px solid rgba(245,160,0,.4)",borderRadius:8,padding:".25rem .55rem",fontSize:".62rem",fontFamily:"Space Mono",color:"var(--neon3)",fontWeight:700}}>🏆 HOT</div>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:".5rem",marginBottom:".85rem"}}>
          {[{val:group.videos.length,lbl:"Loops"},{val:group.members.length,lbl:"Members"},{val:daysOld,lbl:"Days old"}].map(s=>(
            <div key={s.lbl} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:12,padding:".65rem .5rem",textAlign:"center"}}>
              <div style={{fontSize:"1.25rem",fontWeight:800,color:"var(--neon)"}}>{s.val}</div>
              <div style={{fontSize:".6rem",color:"var(--muted)",fontFamily:"Space Mono",marginTop:".22rem"}}>{s.lbl}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:".5rem",overflowX:"auto",paddingBottom:".25rem"}} className="hide-scroll">
          {group.members.map(id=>(
            <div key={id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".28rem",flexShrink:0}}>
              <div style={{position:"relative"}}>
                <div className="av av-sm" style={{background:(users[id]?.color||"#00f5c4")+"22",color:users[id]?.color||"#00f5c4",width:38,height:38,fontSize:".6rem"}}>{users[id]?.avatar||"??"}</div>
                {id===group.adminId&&<div style={{position:"absolute",bottom:-2,right:-2,background:"var(--neon3)",borderRadius:4,fontSize:".45rem",padding:"1px 3px",fontWeight:700,fontFamily:"Space Mono",color:"#000",border:"1.5px solid var(--bg2)"}}>★</div>}
              </div>
              <span style={{fontSize:".55rem",color:"var(--muted)",fontFamily:"Space Mono"}}>{users[id]?.name?.split(" ")[0]||"User"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="scroll-body">
        <div className="sched-panel">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".65rem"}}>
            <div className="sched-panel-title" style={{margin:0}}>Schedule · <span style={{color:"var(--neon)",textTransform:"capitalize"}}>{group.scheduleMode}</span></div>
            {isAdmin&&<button onClick={()=>setShowScheduleEdit(true)} style={{fontSize:".62rem",color:"var(--neon)",fontFamily:"Space Mono",background:"none",border:"none",cursor:"pointer"}}>Edit ›</button>}
          </div>
          <div style={{fontSize:".82rem",color:"var(--muted)",padding:".4rem .5rem"}}>
            {group.scheduleMode==="rotation"&&"Members take turns posting each day in rotation."}
            {group.scheduleMode==="assigned"&&"Each member is assigned specific days to post."}
            {group.scheduleMode==="same"&&"Everyone posts on the same day each week."}
          </div>
        </div>

        <div className="sec-lbl">Loops · {group.videos.length}</div>
        {group.videos.length===0&&<div className="empty"><span className="empty-icon">🎬</span><p>No Loops yet — be first!</p></div>}
        {group.videos.map(v=>(
          <VideoCard key={v.id} video={{...v,group}} users={users} currentUser={currentUser}
            onToggleLike={()=>onToggleLike(group.id,v.id)} onOpenComments={()=>onOpenComments(v)}/>
        ))}

        {!isAdmin&&(
          <div style={{padding:".5rem 1rem 1rem"}}>
            <button className="btn btn-g" style={{width:"100%",color:"#f55050",borderColor:"rgba(245,80,80,.25)",fontSize:".85rem"}}
              onClick={()=>{if(window.confirm(`Leave "${group.name}"?`))onLeaveGroup(group.id);}}>
              Leave Group
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes flamePulse{0%,100%{filter:drop-shadow(0 0 6px rgba(245,160,0,.6))}50%{filter:drop-shadow(0 0 14px rgba(245,160,0,.95))}}`}</style>
    </div>
  );
}

// ─── LOOP IN MODAL ────────────────────────────────────────────────────────────
function LoopInModal({ groups, onClose, onRecord, onUpload, recordedCoverPhoto, recordedVideoBlob }) {
  const fromCamera = recordedVideoBlob != null;
  const [step, setStep]           = useState(fromCamera ? "cover" : "choose");
  const [gid, setGid]             = useState(groups[0]?.id || "");
  const [title, setTitle]         = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(recordedCoverPhoto || null);
  const fileInputRef  = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => { if (recordedCoverPhoto) setCoverPhoto(recordedCoverPhoto); }, [recordedCoverPhoto]);

  const handleCoverFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setCoverPhoto(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (!gid) return;
    // Use recorded blob if came from camera, otherwise use file picker
    let videoBlob = recordedVideoBlob || videoFile || null;
    let coverBlob = null;
    if (coverPhoto) {
      try {
        const res = await fetch(coverPhoto);
        coverBlob = await res.blob();
      } catch(e) { coverBlob = null; }
    }
    onUpload(gid, title || "Untitled Loop", videoBlob, coverBlob);
  };

  return (
    <div className="modal-ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{gap:0,paddingLeft:0,paddingRight:0}}>
        <div className="modal-grab"/>

        {step==="choose"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 1.4rem calc(var(--safe-bot)+1.2rem)",gap:"1.4rem"}}>
            <div style={{width:"100%",display:"flex",justifyContent:"flex-end",paddingTop:".3rem"}}>
              <button className="btn btn-g btn-sm btn-ico" onClick={onClose}><Ic.X/></button>
            </div>
            <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:".4rem"}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,var(--neon),#00b8ff)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 28px rgba(0,245,196,.4)",marginBottom:".2rem"}}>
                <Ic.LoopIn/>
              </div>
              <div style={{fontSize:"1.3rem",fontWeight:800}}>Loop In</div>
              <div style={{fontSize:".78rem",color:"var(--muted)",fontFamily:"Space Mono"}}>share your moment with the group</div>
            </div>

            <button onClick={onRecord} style={{width:"100%",padding:"1.5rem 1.2rem",background:"linear-gradient(135deg,rgba(0,245,196,.1),rgba(0,184,255,.08))",border:"1.5px solid rgba(0,245,196,.35)",borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",gap:".75rem",cursor:"pointer"}}>
              <div style={{width:72,height:72,borderRadius:"50%",border:"3px solid rgba(255,255,255,.7)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#f55,#f500c4)",boxShadow:"0 0 20px rgba(245,85,85,.5)"}}/>
              </div>
              <div>
                <div style={{fontSize:"1.05rem",fontWeight:800,textAlign:"center"}}>Record Now</div>
                <div style={{fontSize:".72rem",color:"var(--muted)",fontFamily:"Space Mono",textAlign:"center"}}>Open camera · 5–15 min</div>
              </div>
            </button>

            <div style={{display:"flex",alignItems:"center",gap:".75rem",width:"100%"}}>
              <div style={{flex:1,height:1,background:"var(--border)"}}/>
              <span style={{fontSize:".62rem",color:"var(--muted)",fontFamily:"Space Mono"}}>OR</span>
              <div style={{flex:1,height:1,background:"var(--border)"}}/>
            </div>

            <button onClick={()=>setStep("post")} style={{width:"100%",padding:".85rem 1.2rem",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:14,display:"flex",alignItems:"center",gap:".85rem",cursor:"pointer"}}>
              <div style={{width:40,height:40,borderRadius:10,background:"var(--bg2)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0}}>📂</div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:".88rem",fontWeight:700}}>Upload from Library</div>
                <div style={{fontSize:".68rem",color:"var(--muted)",fontFamily:"Space Mono",marginTop:2}}>MP4 · MOV</div>
              </div>
              <div style={{marginLeft:"auto",color:"var(--muted)",fontSize:"1.1rem"}}>›</div>
            </button>
          </div>
        )}

        {step==="cover"&&(
          <div style={{display:"flex",flexDirection:"column",padding:"0 1.4rem calc(var(--safe-bot)+1.2rem)",gap:"1rem"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:".3rem"}}>
              <button className="back-btn" onClick={()=>setStep("choose")} style={{marginBottom:0}}><Ic.Back/>Back</button>
              <button className="btn btn-g btn-sm btn-ico" onClick={onClose}><Ic.X/></button>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"1.1rem",fontWeight:800}}>Add a Cover Photo</div>
              <div style={{fontSize:".74rem",color:"var(--muted)",fontFamily:"Space Mono"}}>What your friends see first</div>
            </div>
            <div onClick={()=>coverInputRef.current?.click()} style={{width:"100%",height:200,borderRadius:16,overflow:"hidden",border:`2px dashed ${coverPhoto?"var(--neon)":"var(--border)"}`,background:coverPhoto?"transparent":"var(--bg3)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
              {coverPhoto ? <img src={coverPhoto} alt="cover" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <><div style={{fontSize:"2.5rem"}}>🖼️</div><div style={{fontWeight:700,fontSize:".9rem",marginTop:".5rem"}}>Tap to choose photo</div></>}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleCoverFile}/>
            <div style={{display:"flex",gap:".6rem"}}>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setStep("post")}>Skip →</button>
              {coverPhoto&&<button className="btn btn-p" style={{flex:2}} onClick={()=>setStep("post")}>Use This Cover ✓</button>}
            </div>
          </div>
        )}

        {step==="post"&&(
          <div style={{display:"flex",flexDirection:"column",padding:"0 1.4rem calc(var(--safe-bot)+1.2rem)",gap:"1rem"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:".3rem"}}>
              <button className="back-btn" onClick={()=>setStep("choose")} style={{marginBottom:0}}><Ic.Back/>Back</button>
              <button className="btn btn-g btn-sm btn-ico" onClick={onClose}><Ic.X/></button>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"1.1rem",fontWeight:800}}>Finish Your Loop</div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:".85rem",background:"var(--bg3)",borderRadius:14,padding:".75rem",border:"1px solid var(--border)"}}>
              <div onClick={()=>setStep("cover")} style={{width:60,height:60,borderRadius:10,overflow:"hidden",background:coverPhoto?"transparent":"var(--bg2)",border:`1.5px solid ${coverPhoto?"var(--neon)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                {coverPhoto ? <img src={coverPhoto} alt="cover" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:"1.4rem"}}>🖼️</span>}
              </div>
              <div>
                <div style={{fontSize:".8rem",fontWeight:700}}>{coverPhoto?"Cover photo set":"No cover photo"}</div>
                <button onClick={()=>setStep("cover")} style={{fontSize:".65rem",color:"var(--neon)",fontFamily:"Space Mono",background:"none",border:"none",cursor:"pointer",padding:0}}>{coverPhoto?"Change ›":"Add cover ›"}</button>
              </div>
            </div>

            {fromCamera ? (
              <div style={{background:"rgba(0,245,196,.06)",border:"1.5px solid rgba(0,245,196,.3)",borderRadius:16,padding:"1rem 1.2rem",display:"flex",alignItems:"center",gap:".85rem"}}>
                <span style={{fontSize:"1.5rem"}}>🎬</span>
                <div>
                  <div style={{fontWeight:700,fontSize:".9rem",color:"var(--neon)"}}>Video recorded ✓</div>
                  <div style={{fontSize:".68rem",color:"var(--muted)",fontFamily:"Space Mono",marginTop:2}}>Ready to post</div>
                </div>
              </div>
            ) : (
              <>
                <div className={`upload-zone ${videoFile?"has-file":""}`} onClick={()=>fileInputRef.current?.click()}>
                  <span className="upload-icon">{videoFile?"✅":"📹"}</span>
                  <div style={{fontWeight:700}}>{videoFile?"Video ready!":"Tap to choose video"}</div>
                  <div className="upload-hint">MP4 · MOV · 5–15 min</div>
                </div>
                <input ref={fileInputRef} type="file" accept="video/*" style={{display:"none"}} onChange={e=>setVideoFile(e.target.files[0]||null)}/>
              </>
            )}

            <input placeholder="Give your Loop a title..." value={title} onChange={e=>setTitle(e.target.value)}/>

            <div>
              <div className="lbl">Post to</div>
              <div className="grp-sel-list">
                {groups.map(g=>(
                  <button key={g.id} className={`grp-sel-item ${gid===g.id?"sel":""}`} onClick={()=>setGid(g.id)}>
                    <span style={{fontSize:"1.25rem"}}>{g.emoji}</span>
                    <span className="grp-sel-nm">{g.name}</span>
                    {gid===g.id&&<span style={{marginLeft:"auto",color:"var(--neon)"}}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-p" style={{width:"100%"}} onClick={handlePost}>Post Loop ↑</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CAMERA SCREEN ────────────────────────────────────────────────────────────
function CameraScreen({ onClose, onUseVideo }) {
  const videoRef     = useRef(null);
  const mrRef        = useRef(null);
  const streamRef    = useRef(null);
  const chunksRef    = useRef([]);
  const timerRef     = useRef(null);
  const canvasRef    = useRef(document.createElement("canvas"));
  const coverInputRef = useRef(null);
  const facingRef    = useRef("user"); // useRef so flipCam always reads latest value

  const [facing, setFacing]         = useState("user");
  const [recState, setRecState]     = useState("idle");
  const [secs, setSecs]             = useState(0);
  const [hasCam, setHasCam]         = useState(true);
  const [warn, setWarn]             = useState(null);
  const [segments, setSegments]     = useState([]);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverAnim, setCoverAnim]   = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState(null); // store recorded blob

  const MAX = 900, MIN = 300;

  // Start camera — accepts facing directly so it never reads stale state
  const startCam = async (f) => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try {
      const constraints = {
        video: { facingMode: f, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(()=>{});
      }
      setHasCam(true);
    } catch(e) {
      console.error("Camera error:", e);
      setHasCam(false);
    }
  };

  useEffect(() => {
    startCam("user");
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
    };
  }, []);

  // Fix: use ref to always flip to the correct next camera
  const flipCam = async () => {
    const next = facingRef.current === "user" ? "environment" : "user";
    facingRef.current = next;
    setFacing(next);
    await startCam(next);
  };

  const startRec = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    // iOS Safari uses mp4, others use webm
    const mimeType = MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const mr = new MediaRecorder(streamRef.current, { mimeType });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      // Build blob as soon as recording stops
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      const url = URL.createObjectURL(blob);
      setVideoBlobUrl(url);
    };
    mr.start(100);
    mrRef.current = mr;
    setSecs(0); setRecState("recording");
    timerRef.current = setInterval(() => setSecs(s => {
      if (s + 1 >= MAX) { stopRec(); return s; }
      if (s + 1 === MIN) { setWarn("5 min reached — you can stop anytime"); setTimeout(() => setWarn(null), 2500); }
      return s + 1;
    }), 1000);
  };

  const pauseRec = () => {
    mrRef.current?.pause();
    clearInterval(timerRef.current);
    setSegments(sg => [...sg, secs]);
    setRecState("paused");
  };

  const resumeRec = () => {
    mrRef.current?.resume();
    setRecState("recording");
    timerRef.current = setInterval(() => setSecs(s => {
      if (s + 1 >= MAX) { stopRec(); return s; }
      return s + 1;
    }), 1000);
  };

  const stopRec = () => {
    mrRef.current?.stop(); // triggers onstop → builds blob
    clearInterval(timerRef.current);
    setRecState("done");
  };

  // Snap cover from live camera — keep stream running during cover step
  const snapCover = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.save();
    if (facingRef.current === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    setCoverPhoto(canvas.toDataURL("image/jpeg", 0.9));
    setCoverAnim(true);
    setTimeout(() => setCoverAnim(false), 400);
  };

  const handleCoverFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setCoverPhoto(URL.createObjectURL(f));
  };

  const handleFinish = (cover) => {
    // Build the actual blob from chunks to pass back
    const blob = chunksRef.current.length > 0
      ? new Blob(chunksRef.current, { type: mrRef.current?.mimeType || "video/mp4" })
      : null;
    onUseVideo(cover, blob);
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const prevTotal = segments.length > 0 ? segments[segments.length - 1] : 0;
  const activeWidth = recState === "recording" ? ((secs - prevTotal) / MAX) * 100 : 0;

  // ── COVER STEP ── (camera still live in background for snapping)
  if (recState === "cover") {
    return (
      <div className="cam-screen" style={{background:"#000"}}>
        {/* Live camera blurred in background — stream still running */}
        <video ref={videoRef}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            opacity:.15,filter:"blur(14px)",
            transform:facing==="user"?"scaleX(-1)":"none"}}
          muted playsInline autoPlay/>

        <div style={{position:"relative",zIndex:5,display:"flex",flexDirection:"column",
          height:"100%",
          padding:"calc(env(safe-area-inset-top,44px) + 1rem) 1.2rem calc(env(safe-area-inset-bottom,34px) + 1.2rem)",
          gap:"1rem"}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <button className="cam-close-btn" onClick={()=>setRecState("done")}
              style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.15)"}}>
              <Ic.Back/>
            </button>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"1rem",fontWeight:800,color:"#fff"}}>Cover Photo</div>
              <div style={{fontSize:".6rem",color:"rgba(255,255,255,.5)",fontFamily:"Space Mono"}}>what your friends see first</div>
            </div>
            <button className="cam-close-btn" onClick={onClose}><Ic.X/></button>
          </div>

          {/* Preview */}
          <div style={{flex:1,borderRadius:18,overflow:"hidden",position:"relative",
            border:`2px solid ${coverPhoto?"var(--neon)":"rgba(255,255,255,.12)"}`,
            background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",minHeight:200}}>
            {coverPhoto
              ? <img src={coverPhoto} alt="cover" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : <div style={{textAlign:"center",color:"rgba(255,255,255,.4)"}}>
                  <div style={{fontSize:"3rem"}}>🖼️</div>
                  <div style={{fontSize:".82rem",fontWeight:600,marginTop:".5rem"}}>Snap or choose a photo</div>
                </div>}
            {coverAnim && <div style={{position:"absolute",inset:0,background:"#fff",borderRadius:16,animation:"flashOut .4s ease forwards"}}/>}
            {coverPhoto && <div style={{position:"absolute",bottom:".75rem",right:".75rem",background:"rgba(0,245,196,.9)",color:"#000",padding:".22rem .55rem",borderRadius:7,fontSize:".6rem",fontFamily:"Space Mono",fontWeight:700}}>✓ SET</div>}
          </div>

          {/* Actions */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".65rem"}}>
            <button onClick={snapCover} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".45rem",
              padding:"1rem .5rem",border:"1.5px solid rgba(255,255,255,.18)",borderRadius:14,
              background:"rgba(255,255,255,.07)",cursor:"pointer"}}>
              <div style={{width:44,height:44,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,.8)",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,.85)"}}/>
              </div>
              <div style={{fontSize:".78rem",fontWeight:700,color:"#fff"}}>Snap Photo</div>
            </button>
            <button onClick={()=>coverInputRef.current?.click()} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".45rem",
              padding:"1rem .5rem",border:"1.5px solid rgba(255,255,255,.18)",borderRadius:14,
              background:"rgba(255,255,255,.07)",cursor:"pointer"}}>
              <span style={{fontSize:"2.2rem",lineHeight:1}}>🗂️</span>
              <div style={{fontSize:".78rem",fontWeight:700,color:"#fff"}}>From Library</div>
            </button>
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleCoverFile}/>

          {/* Continue buttons */}
          <div style={{display:"flex",gap:".6rem"}}>
            <button className="btn btn-g" style={{flex:1,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.7)"}}
              onClick={()=>handleFinish(null)}>Skip</button>
            <button className="btn btn-p" style={{flex:2}}
              onClick={()=>handleFinish(coverPhoto)}>
              {coverPhoto ? "Use This Cover →" : "Continue →"}
            </button>
          </div>
        </div>
        <style>{`@keyframes flashOut{from{opacity:.7}to{opacity:0}}`}</style>
      </div>
    );
  }

  return (
    <div className="cam-screen">
      <video ref={videoRef} className="cam-video" muted playsInline autoPlay
        style={{transform:facing==="user"?"scaleX(-1)":"none"}}/>
      <canvas ref={canvasRef} style={{display:"none"}}/>

      {recState !== "idle" && (
        <div className="seg-bar">
          {segments.map((seg, i) => {
            const prev = i === 0 ? 0 : segments[i - 1];
            return <div key={i} className="seg-fill" style={{width:`${((seg-prev)/MAX)*100}%`,background:"rgba(0,245,196,.55)"}}/>;
          })}
          {(recState==="recording"||recState==="paused") && <div className="seg-fill" style={{width:`${activeWidth}%`,background:"var(--neon)"}}/>}
        </div>
      )}

      {(recState==="recording"||recState==="paused") && (
        <div className={`rec-timer ${recState==="paused"?"paused-state":""}`}>
          <div className="rec-dot"/>{fmt(secs)} / {fmt(MAX)}
        </div>
      )}
      {warn && <div className="dur-warn">⚡ {warn}</div>}

      {/* TOP BAR */}
      <div className="cam-top">
        <button className="cam-close-btn" onClick={onClose}><Ic.X/></button>
        <div style={{color:"rgba(255,255,255,.82)",fontSize:".7rem",fontFamily:"Space Mono",fontWeight:700}}>
          {recState==="idle"&&"READY"}{recState==="recording"&&"● REC"}{recState==="paused"&&"⏸ PAUSED"}{recState==="done"&&"✓ DONE"}
        </div>
        <button className="cam-flip-btn" onClick={flipCam} disabled={recState==="recording"}><Ic.Flip/></button>
      </div>

      {!hasCam && (
        <div className="no-cam-overlay">
          <span style={{fontSize:"3rem"}}>📷</span>
          <p style={{color:"var(--muted)",fontFamily:"Space Mono",fontSize:".78rem",textAlign:"center",lineHeight:1.75,padding:"0 2.5rem"}}>
            Camera access required.<br/>Enable in your browser settings.
          </p>
          <button className="btn btn-g btn-sm" onClick={onClose}>Go Back</button>
        </div>
      )}

      {/* BOTTOM BAR */}
      <div className="cam-bot">
        <div style={{width:50,display:"flex",justifyContent:"center"}}>
          {recState==="recording" && <button className="pause-resume-btn" onClick={pauseRec}><Ic.Pause/></button>}
          {recState==="paused" && <button className="pause-resume-btn resume" onClick={resumeRec}><Ic.Resume/></button>}
        </div>

        <div className="rec-btn-wrap">
          {recState === "done" ? (
            <button className="btn btn-p" style={{borderRadius:30,padding:".88rem 1.8rem",fontSize:".88rem"}}
              onClick={() => setRecState("cover")}>
              Add Cover Photo →
            </button>
          ) : (
            <button className="rec-btn" onClick={() => { if (recState==="idle") startRec(); else stopRec(); }}>
              <div className={`rec-inner ${recState==="recording"?"recording":recState==="paused"?"paused":""}`}/>
            </button>
          )}
          <div className="rec-label">
            {recState==="idle"&&"tap to record"}
            {recState==="recording"&&"tap to stop"}
            {recState==="paused"&&"tap to stop"}
          </div>
        </div>

        <div style={{width:50,display:"flex",justifyContent:"center"}}>
          {recState==="done" && (
            <button onClick={()=>handleFinish(null)} style={{background:"none",border:"none",cursor:"pointer",
              color:"rgba(255,255,255,.45)",fontFamily:"Space Mono",fontSize:".6rem",textAlign:"center",lineHeight:1.5}}>
              Skip<br/>Cover
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GROUP MODAL ──────────────────────────────────────────────────────────────
function GroupModal({ onClose, onCreate, onJoin }) {
  const [mt, setMt]       = useState("create");
  const [gname, setGname] = useState("");
  const [emoji, setEmoji] = useState("🎬");
  const [mode, setMode]   = useState("rotation");
  const [code, setCode]   = useState("");
  const emojis = ["🎬","🏄","🏠","🌍","🎸","🏃","🍕","🌙","⚡","🔥","🎮","📸"];

  const scheduleOptions = [
    {id:"rotation",icon:"🔄",label:"Daily Rotation",desc:"Next person each day"},
    {id:"assigned",icon:"📅",label:"Assigned Days",desc:"Each member gets a day"},
    {id:"same",icon:"👥",label:"Same Day",desc:"Everyone posts together"},
  ];

  return (
    <div className="modal-ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-grab"/>
        <div className="modal-hdr">
          <div>
            <div className="modal-title">{mt==="create"?"Create a Group":"Join a Group"}</div>
            <div style={{fontSize:".7rem",color:"var(--muted)",fontFamily:"Space Mono",marginTop:".1rem"}}>{mt==="create"?"Set up your Loop group":"Enter an invite code"}</div>
          </div>
          <button className="btn btn-g btn-sm btn-ico" onClick={onClose}><Ic.X/></button>
        </div>
        <div className="modal-tabs">
          <button className={`m-tab ${mt==="create"?"active":""}`} onClick={()=>setMt("create")}>Create</button>
          <button className={`m-tab ${mt==="join"?"active":""}`} onClick={()=>setMt("join")}>Join</button>
        </div>
        {mt==="create"&&<>
          <div><div className="lbl">Group icon</div><div className="emoji-row">{emojis.map(e=><button key={e} className={`emo-btn ${emoji===e?"active":""}`} onClick={()=>setEmoji(e)}>{e}</button>)}</div></div>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",left:".9rem",top:"50%",transform:"translateY(-50%)",fontSize:"1.2rem",pointerEvents:"none"}}>{emoji}</div>
            <input placeholder="Group name..." value={gname} onChange={e=>setGname(e.target.value)} style={{paddingLeft:"2.6rem"}}/>
          </div>
          <div>
            <div className="lbl">Upload schedule</div>
            <div style={{display:"flex",flexDirection:"column",gap:".45rem"}}>
              {scheduleOptions.map(m=>(
                <button key={m.id} onClick={()=>setMode(m.id)} style={{display:"flex",alignItems:"center",gap:".85rem",padding:".75rem .9rem",borderRadius:13,border:`1.5px solid ${mode===m.id?"var(--neon)":"var(--border)"}`,background:mode===m.id?"rgba(0,245,196,.06)":"var(--bg3)",cursor:"pointer",textAlign:"left",width:"100%"}}>
                  <span style={{fontSize:"1.4rem",flexShrink:0}}>{m.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".88rem",fontWeight:700,color:mode===m.id?"var(--neon)":"var(--text)",fontFamily:"Syne"}}>{m.label}</div>
                    <div style={{fontSize:".65rem",color:"var(--muted)",fontFamily:"Space Mono"}}>{m.desc}</div>
                  </div>
                  {mode===m.id&&<div style={{width:18,height:18,borderRadius:"50%",background:"var(--neon)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg viewBox="0 0 10 8" fill="none" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{width:10}}><polyline points="1,4 4,7 9,1"/></svg></div>}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-p" style={{width:"100%"}} onClick={()=>{if(!gname.trim())return;onCreate({name:gname.trim(),emoji,scheduleMode:mode});onClose();}}>Create Group →</button>
        </>}
        {mt==="join"&&<>
          <div style={{textAlign:"center",padding:"1.2rem 0 .4rem",display:"flex",flexDirection:"column",alignItems:"center",gap:".6rem"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(0,245,196,.08)",border:"1.5px solid rgba(0,245,196,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.6rem"}}>🔗</div>
            <div style={{fontSize:".85rem",color:"var(--muted)",lineHeight:1.6}}>Ask a friend for their 6-character<br/>Group invite code to join.</div>
          </div>
          <div><div className="lbl">Invite code</div>
            <input placeholder="e.g. WAVE42" value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onJoin(code)} style={{textTransform:"uppercase",fontFamily:"Space Mono",letterSpacing:".2em",textAlign:"center",fontSize:"1.15rem",fontWeight:700}}/>
          </div>
          <button className="btn btn-p" style={{width:"100%"}} onClick={()=>{onJoin(code);onClose();}}>Join Group →</button>
        </>}
      </div>
    </div>
  );
}

// ─── ME SCREEN ────────────────────────────────────────────────────────────────
function MeScreen({ profile, groups, videos, notifs, unread, onMarkRead, onLogout }) {
  const myVids = videos.filter(v => v.userId === profile.id);
  return (
    <div className="screen">
      <div className="prof-hero">
        <div className="av av-xl" style={{background:(profile.avatar_color||"#00f5c4")+"22",color:profile.avatar_color||"#00f5c4",border:`2px solid ${profile.avatar_color||"#00f5c4"}`}}>{initials(profile.full_name||profile.username)}</div>
        <div className="prof-name">{profile.full_name || profile.username}</div>
        <div className="prof-un">@{profile.username}</div>
        <div className="prof-stats">
          <div className="stat"><div className="stat-v">{groups.length}</div><div className="stat-l">Groups</div></div>
          <div className="stat"><div className="stat-v">{myVids.length}</div><div className="stat-l">Loops</div></div>
          <div className="stat"><div className="stat-v">{myVids.reduce((a,v)=>a+v.likes.length,0)}</div><div className="stat-l">Likes</div></div>
        </div>
      </div>
      <div className="scroll-body">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.1rem",margin:".9rem 0 .35rem"}}>
          <div className="sec-lbl" style={{margin:0,padding:0}}>
            Notifications
            {unread>0&&<span style={{marginLeft:".4rem",background:"var(--neon2)",color:"#fff",padding:".04rem .36rem",borderRadius:"20px",fontSize:".54rem",fontWeight:700}}>{unread}</span>}
          </div>
          {unread>0&&<button className="btn btn-g btn-sm" onClick={onMarkRead} style={{fontSize:".66rem",padding:".28rem .65rem"}}>Mark read</button>}
        </div>
        {notifs.length===0&&<div style={{color:"var(--muted)",fontSize:".82rem",textAlign:"center",padding:"1.5rem 0",fontFamily:"Space Mono"}}>No notifications yet</div>}
        {notifs.slice(0,5).map(n=>(
          <div key={n.id} className="notif-item">
            {!n.read&&<div className="notif-dot"/>}
            {n.read&&<div style={{width:8,flexShrink:0}}/>}
            <div>
              <div className="notif-txt" style={{color:n.read?"var(--muted)":"var(--text)"}}>{n.text}</div>
              <div className="notif-time">{timeAgo(n.time)}</div>
            </div>
          </div>
        ))}
        <div style={{padding:"1.4rem 1rem .5rem"}}>
          <button className="btn btn-g" style={{width:"100%",color:"#f55050",borderColor:"rgba(245,80,80,.28)"}} onClick={onLogout}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
