/** Own UI plus the user's narrowly approved, reversible rc.2 sidebar markers. */
export const duoStyles = String.raw`
.dsh-duo-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.dsh-duo-navigation,.dsh-duo-brand-control,.dsh-duo-brand-name,.dsh-duo-main-anchor,.dsh-duo-web-surface{font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);color:var(--dsw-alias-label-primary,#22242a);box-sizing:border-box;font-size:14px}
.dsh-duo-navigation *,.dsh-duo-brand-control *,.dsh-duo-brand-name *,.dsh-duo-main-anchor *,.dsh-duo-web-surface *{box-sizing:border-box}
.dsh-duo-navigation button,.dsh-duo-brand-control button,.dsh-duo-main-anchor button,.dsh-duo-web-surface button{font:inherit;-webkit-app-region:no-drag}
.dsh-duo-navigation button:focus-visible,.dsh-duo-brand-control button:focus-visible,.dsh-duo-main-anchor button:focus-visible,.dsh-duo-web-surface button:focus-visible{outline:2px solid #4d6bfe;outline-offset:3px}
.dsh-duo-modes{display:flex;align-items:center;gap:2px;border:0;padding:3px;margin:0;border-radius:9px;background:var(--dsw-alias-interactive-bg-hover,#e7e9ed);min-width:0;width:max-content}
.dsh-duo-modes button{padding:6px 9px;border:0;background:transparent;border-radius:6px;color:inherit;font-size:10px;font-weight:650;letter-spacing:.35px;white-space:nowrap;cursor:pointer;min-height:27px}
.dsh-duo-modes button[aria-pressed="true"]{background:#fff;color:#242832;box-shadow:0 1px 3px #151e2f15}
.dsh-duo-modes:disabled{opacity:.42}.dsh-duo-modes:disabled button{cursor:not-allowed}
.dsh-duo-mode-compact .dsh-duo-modes{flex-direction:column;width:30px;gap:3px}.dsh-duo-mode-compact .dsh-duo-modes button{width:24px;padding:4px 2px}
[data-dsh-duo-brand-fill="identity"]{flex:1;width:100%}
[data-dsh-duo-brand-fill="name"]{flex:1}
[data-dsh-duo-sidebar-mode="chat"] [data-dsh-duo-plugin-row="true"],
[data-dsh-duo-sidebar-mode="chat"] [data-dsh-duo-only-plugins="true"]{display:none}
[data-dsh-duo-sidebar-mode="chat"] [data-dsh-duo-new-session="true"]:disabled{opacity:.45;cursor:default}
.dsh-duo-brand-name{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%;flex:1;width:100%}
.dsh-duo-brand-wordmark{display:block;flex:0 1 102px;min-width:0;width:102px;height:24px;overflow:hidden}
.dsh-duo-brand-wordmark svg{display:block;width:156px;max-width:none;height:24px}
.dsh-duo-brand-anchor{display:block;width:112px;height:24px;flex:none;margin-left:auto;pointer-events:none}
.dsh-duo-brand-control{position:fixed;z-index:30;pointer-events:auto;display:flex;align-items:center;-webkit-app-region:no-drag}
.dsh-duo-brand-control .dsh-duo-modes{padding:2px;border-radius:5px;gap:1px}
.dsh-duo-brand-control .dsh-duo-mode-wrap,.dsh-duo-brand-control .dsh-duo-modes{width:100%}
.dsh-duo-brand-control .dsh-duo-modes button{flex:1}
.dsh-duo-brand-control .dsh-duo-modes button{font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);padding:4px 6px;min-height:22px;font-size:9px;letter-spacing:.2px;border-radius:3px}
.dsh-duo-authorization-notice{position:absolute;top:calc(100% + 6px);right:0;width:230px;max-width:calc(100vw - 24px);padding:10px 12px;z-index:40;border:1px solid var(--dsw-alias-border-l2,#dee1e8);border-radius:8px;background:var(--dsw-specific-sidebar-fill,#f4f5f8);box-shadow:0 4px 16px #0d1a3520;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-primary,#22242a)}
.dsh-duo-authorization-notice p{margin:0 0 5px}
.dsh-duo-navigation{display:flex;flex-direction:column;height:100%;min-height:0;background:transparent;color:inherit}
.dsh-duo-navigation-header{display:flex;align-items:center;justify-content:space-between;padding:0 14px 8px 16px;min-height:36px;color:var(--dsw-alias-label-secondary,#8b8d91);font-size:14px}
.dsh-duo-navigation-header>div{display:flex;gap:2px}
.dsh-duo-icon-button{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary,#8b8d91);cursor:pointer;font-size:21px!important}.dsh-duo-icon-button:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0d)}.dsh-duo-icon-button:disabled{opacity:.4;cursor:default}
.dsh-duo-navigation-search{margin:0 14px 8px;padding:7px 9px;min-width:0;border:1px solid var(--dsw-alias-border-l2,#85858b40);border-radius:6px;background:transparent;color:inherit;font:inherit;font-size:12px}
.dsh-duo-navigation-list{flex:1;min-height:0;overflow:auto;padding:0 12px 12px;scrollbar-width:thin}
.dsh-duo-conversation-group h3{font-size:12px;font-weight:400;color:var(--dsw-alias-label-secondary,#8b8d91);margin:15px 4px 6px}
.dsh-duo-conversation-row{display:block;width:100%;min-height:32px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:7px 10px;border:0;border-radius:8px;background:transparent;color:inherit;font-size:13px;cursor:pointer}.dsh-duo-conversation-row:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0d)}.dsh-duo-conversation-row[aria-current=page]{background:var(--dsw-alias-interactive-bg-active,#ffffff14)}
.dsh-duo-navigation-status{font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary,#8b8d91);padding:6px 4px}
.dsh-duo-navigation-rail{align-items:center;padding-top:6px}
.dsh-duo-text-button{padding:7px 4px;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#8b8d91);font-size:11px!important;cursor:pointer}
.dsh-duo-main-anchor{height:100%;min-width:0;width:100%;position:relative;background:var(--dsw-alias-bg-base,#fff)}
.dsh-duo-web-surface{position:fixed;z-index:20;pointer-events:auto;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#fff);overflow:hidden}
.dsh-duo-web-toolbar{height:48px;flex:none;display:flex;align-items:center;gap:12px;padding:0 18px 0 max(18px,var(--dsh-frame-leading-clearance,0px));border-bottom:1px solid var(--dsw-alias-border-l2,#e2e6ed);background:var(--dsw-alias-bg-base,#fff);-webkit-app-region:drag}.dsh-duo-web-toolbar strong{font-size:11px;font-weight:550}.dsh-duo-web-toolbar small{font-size:10px;color:var(--dsw-alias-label-secondary,#8190a2)}
.dsh-duo-web-toolbar-spacer{flex:1}.dsh-duo-web-toolbar button{flex:none;font-size:11px;border:1px solid var(--dsw-alias-border-l2,#e2e7ef);border-radius:7px;background:transparent;padding:6px 9px;color:var(--dsw-alias-label-secondary,#768396);cursor:pointer}.dsh-duo-web-toolbar button:disabled{opacity:.42;cursor:not-allowed}
.dsh-duo-web-content{position:relative;flex:1;min-height:0;display:flex}.dsh-duo-webview{display:flex;width:100%;height:100%;flex:1;border:0}
.dsh-duo-web-status{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,calc(100% - 40px));text-align:center;padding:22px;border:1px solid var(--dsw-alias-border-l2,#e4e9f0);border-radius:12px;background:var(--dsw-alias-bg-base,#fff);font-size:12px;line-height:1.8;pointer-events:none}.dsh-duo-web-status strong{display:block;font-size:15px;font-weight:550;margin-bottom:9px}.dsh-duo-web-status p{color:var(--dsw-alias-label-secondary,#8190a2);margin:0}.dsh-duo-web-status-error{color:#a24f40}
.dsh-duo-unavailable{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}.dsh-duo-unavailable h2{font-size:20px;font-weight:550}.dsh-duo-unavailable p{color:var(--dsw-alias-label-secondary,#8190a2);font-size:12px}.dsh-duo-unavailable button{margin-top:18px;border:0;border-radius:8px;background:#4d6bfe;color:#fff;padding:10px 18px;cursor:pointer}
.dsh-duo-web-status button{pointer-events:auto;margin-top:12px}
@media(max-width:720px){.dsh-duo-web-toolbar{gap:7px;padding-right:10px}.dsh-duo-web-toolbar small{display:none}.dsh-duo-web-toolbar button{font-size:10px;padding:6px}.dsh-duo-web-toolbar .dsh-duo-modes button{padding:5px 6px}}
`
