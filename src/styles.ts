/** Component-owned CSS only. No website or shipped DSH DOM is selected or rewritten. */
export const duoStyles = String.raw`
.dsh-duo-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.dsh-duo-sidebar,.dsh-duo-brand-control,.dsh-duo-brand-name,.dsh-duo-leading,.dsh-duo-main-anchor,.dsh-duo-web-surface{font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);color:var(--dsw-alias-label-primary,#22242a);box-sizing:border-box;font-size:14px}
.dsh-duo-sidebar *,.dsh-duo-brand-control *,.dsh-duo-brand-name *,.dsh-duo-leading *,.dsh-duo-main-anchor *,.dsh-duo-web-surface *{box-sizing:border-box}
.dsh-duo-sidebar button,.dsh-duo-brand-control button,.dsh-duo-brand-name button,.dsh-duo-leading button,.dsh-duo-main-anchor button,.dsh-duo-web-surface button{font:inherit;-webkit-app-region:no-drag}
.dsh-duo-sidebar button:focus-visible,.dsh-duo-brand-control button:focus-visible,.dsh-duo-brand-name button:focus-visible,.dsh-duo-leading button:focus-visible,.dsh-duo-web-surface button:focus-visible{outline:2px solid #4d6bfe;outline-offset:3px}
.dsh-duo-modes{display:flex;align-items:center;gap:2px;border:0;padding:3px;margin:0;border-radius:9px;background:var(--dsw-alias-interactive-bg-hover,#e7e9ed);min-width:0;width:max-content}
.dsh-duo-modes button{padding:6px 9px;border:0;background:transparent;border-radius:6px;color:inherit;font-size:10px;font-weight:650;letter-spacing:.35px;white-space:nowrap;cursor:pointer;min-height:27px}
.dsh-duo-modes button[aria-pressed="true"]{background:#fff;color:#242832;box-shadow:0 1px 3px #151e2f15}
.dsh-duo-modes:disabled{opacity:.42}.dsh-duo-modes:disabled button{cursor:not-allowed}
.dsh-duo-mode-compact .dsh-duo-modes{flex-direction:column;width:30px;gap:3px}.dsh-duo-mode-compact .dsh-duo-modes button{width:24px;padding:4px 2px}
.dsh-duo-brand-name{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%}
.dsh-duo-brand-wordmark{display:block;flex:0 1 102px;min-width:0;width:102px;height:24px;overflow:hidden}
.dsh-duo-brand-wordmark svg{display:block;width:156px;max-width:none;height:24px}
.dsh-duo-brand-anchor{display:block;width:112px;height:24px;flex:none;pointer-events:none}
.dsh-duo-brand-control{position:fixed;z-index:30;pointer-events:auto;display:flex;align-items:center;-webkit-app-region:no-drag}
.dsh-duo-brand-control .dsh-duo-modes,.dsh-duo-brand-chat-control .dsh-duo-modes{padding:2px;border-radius:5px;gap:1px}
.dsh-duo-brand-control .dsh-duo-modes button,.dsh-duo-brand-chat-control .dsh-duo-modes button{font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);padding:4px 6px;min-height:22px;font-size:9px;letter-spacing:.2px;border-radius:3px}
.dsh-duo-brand-chat-control{position:relative;flex:none}
.dsh-duo-authorization-notice{position:absolute;top:calc(100% + 6px);right:0;width:230px;max-width:calc(100vw - 24px);padding:10px 12px;z-index:40;border:1px solid var(--dsw-alias-border-l2,#dee1e8);border-radius:8px;background:var(--dsw-specific-sidebar-fill,#f4f5f8);box-shadow:0 4px 16px #0d1a3520;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-primary,#22242a)}
.dsh-duo-authorization-notice p{margin:0 0 5px}
.dsh-duo-footnote{font-size:11px;line-height:1.75;margin:10px 0;color:var(--dsw-alias-label-secondary,#737780);overflow-wrap:anywhere}
.dsh-duo-text-button{padding:4px 0;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#7f8998);font-size:11px!important;cursor:pointer}
.dsh-duo-sidebar{display:flex;flex-direction:column;height:100%;min-width:0;padding:8px 12px 12px;background:var(--dsw-specific-sidebar-fill,#f3f5f8)}
.dsh-duo-sidebar-chrome{display:flex;justify-content:flex-end;align-items:center;min-height:28px;margin-bottom:8px;-webkit-app-region:drag}
.dsh-duo-icon-button{display:inline-flex;align-items:center;justify-content:center;flex:none;width:32px;height:32px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#68717e);cursor:pointer;font-size:22px!important}.dsh-duo-icon-button:hover{background:var(--dsw-alias-interactive-bg-hover,#e6e9ef)}
.dsh-duo-brand{display:flex;align-items:center;gap:8px;margin:0 0 27px 4px;min-height:32px}.dsh-duo-mark{color:#4d6bfe;display:flex;flex:none}
.dsh-duo-website-intro{padding:0 7px}.dsh-duo-caption{font-size:9px;letter-spacing:1.5px;color:var(--dsw-alias-label-secondary,#8490a1)}
.dsh-duo-website-intro h2{font-size:18px;font-weight:550;line-height:1.6;margin:12px 0 10px}.dsh-duo-website-intro>p{font-size:12px;line-height:1.85;color:var(--dsw-alias-label-secondary,#778396)}
.dsh-duo-note{padding:14px 12px;border:1px solid var(--dsw-alias-border-l2,#dde2eb);border-radius:10px;margin:20px 0}.dsh-duo-note strong{font-size:11px;font-weight:550}.dsh-duo-note p{font-size:11px;line-height:1.85;margin:6px 0 0;color:var(--dsw-alias-label-secondary,#8490a1)}
.dsh-duo-spacer{flex:1}
.dsh-duo-account-button{border:0;background:transparent;display:flex;align-items:center;gap:9px;width:100%;padding:9px 4px;color:inherit;cursor:pointer;text-align:left;border-top:1px solid var(--dsw-alias-border-l2,#e1e5ed)}
.dsh-duo-avatar{display:flex;align-items:center;justify-content:center;width:31px;height:31px;border-radius:50%;background:#e1e7f7;color:#5671ad;font-size:11px;flex:none}.dsh-duo-account-button>span:nth-child(2){flex:1;min-width:0;overflow:hidden}.dsh-duo-account-button strong{display:block;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:550}.dsh-duo-account-button small{display:block;font-size:10px;margin-top:3px;color:var(--dsw-alias-label-secondary,#9098a5)}
.dsh-duo-sidebar-collapsed{align-items:center;padding:10px 5px;gap:14px;width:100%}.dsh-duo-sidebar-collapsed .dsh-duo-sidebar-chrome{margin:0}.dsh-duo-sidebar-collapsed .dsh-duo-brand{margin:0}.dsh-duo-leading{display:flex;align-items:center;gap:8px}.dsh-duo-leading .dsh-duo-icon-button{width:28px;height:28px}
.dsh-duo-main-anchor{height:100%;min-width:0;width:100%;position:relative;background:var(--dsw-alias-bg-base,#fff)}
.dsh-duo-web-surface{position:fixed;z-index:20;pointer-events:auto;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#fff);overflow:hidden}
.dsh-duo-web-toolbar{height:48px;flex:none;display:flex;align-items:center;gap:12px;padding:0 18px 0 max(18px,var(--dsh-frame-leading-clearance,0px));border-bottom:1px solid var(--dsw-alias-border-l2,#e2e6ed);background:var(--dsw-alias-bg-base,#fff);-webkit-app-region:drag}.dsh-duo-web-toolbar strong{font-size:11px;font-weight:550}.dsh-duo-web-toolbar small{font-size:10px;color:var(--dsw-alias-label-secondary,#8190a2)}
.dsh-duo-web-toolbar-spacer{flex:1}.dsh-duo-web-toolbar button{flex:none;font-size:11px;border:1px solid var(--dsw-alias-border-l2,#e2e7ef);border-radius:7px;background:transparent;padding:6px 9px;color:var(--dsw-alias-label-secondary,#768396);cursor:pointer}.dsh-duo-web-toolbar button:disabled{opacity:.42;cursor:not-allowed}
.dsh-duo-web-content{position:relative;flex:1;min-height:0;display:flex}.dsh-duo-webview{display:flex;width:100%;height:100%;flex:1;border:0}
.dsh-duo-web-status{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,calc(100% - 40px));text-align:center;padding:22px;border:1px solid var(--dsw-alias-border-l2,#e4e9f0);border-radius:12px;background:var(--dsw-alias-bg-base,#fff);font-size:12px;line-height:1.8;pointer-events:none}.dsh-duo-web-status strong{display:block;font-size:15px;font-weight:550;margin-bottom:9px}.dsh-duo-web-status p{color:var(--dsw-alias-label-secondary,#8190a2);margin:0}.dsh-duo-web-status-error{color:#a24f40}
.dsh-duo-unavailable{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}.dsh-duo-unavailable h2{font-size:20px;font-weight:550}.dsh-duo-unavailable p{color:var(--dsw-alias-label-secondary,#8190a2);font-size:12px}.dsh-duo-unavailable button{margin-top:18px;border:0;border-radius:8px;background:#4d6bfe;color:#fff;padding:10px 18px;cursor:pointer}
.dsh-duo-web-disclaimer{flex:none;padding:6px 14px;background:var(--dsw-alias-bg-base,#fff);border-top:1px solid var(--dsw-alias-border-l2,#e5e9f0);font-size:9px;line-height:1.6;color:var(--dsw-alias-label-secondary,#8995a5);text-align:center}
@media(max-width:720px){.dsh-duo-web-toolbar{gap:7px;padding-right:10px}.dsh-duo-web-toolbar small{display:none}.dsh-duo-web-toolbar button{font-size:10px;padding:6px}.dsh-duo-web-toolbar .dsh-duo-modes button{padding:5px 6px}}
`
