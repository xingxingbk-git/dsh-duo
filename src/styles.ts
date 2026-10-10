/** Own UI plus the user's narrowly approved, reversible rc.2 sidebar markers. */
export const chatStyles = String.raw`
.dsh-chat-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.dsh-chat-navigation,.dsh-chat-brand-control,.dsh-chat-brand-name,.dsh-chat-main-anchor,.dsh-chat-web-surface{font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);color:var(--dsw-alias-label-primary,#22242a);box-sizing:border-box;font-size:14px}
.dsh-chat-navigation *,.dsh-chat-brand-control *,.dsh-chat-brand-name *,.dsh-chat-main-anchor *,.dsh-chat-web-surface *{box-sizing:border-box}
.dsh-chat-navigation button,.dsh-chat-brand-control button,.dsh-chat-main-anchor button,.dsh-chat-web-surface button{font:inherit;-webkit-app-region:no-drag}
.dsh-chat-navigation button:focus-visible,.dsh-chat-brand-control button:focus-visible,.dsh-chat-main-anchor button:focus-visible,.dsh-chat-web-surface button:focus-visible{outline:2px solid #4d6bfe;outline-offset:3px}
.dsh-chat-modes{display:flex;align-items:center;gap:2px;border:0;padding:3px;margin:0;border-radius:9px;background:var(--dsw-alias-interactive-bg-hover,#e7e9ed);min-width:0;width:max-content}
.dsh-chat-modes button{padding:6px 9px;border:0;background:transparent;border-radius:6px;color:inherit;font-size:10px;font-weight:650;letter-spacing:.35px;white-space:nowrap;cursor:pointer;min-height:27px}
.dsh-chat-modes button[aria-pressed="true"]{background:#fff;color:#242832;box-shadow:0 1px 3px #151e2f15}
.dsh-chat-modes:disabled{opacity:.42}.dsh-chat-modes:disabled button{cursor:not-allowed}
.dsh-chat-mode-compact .dsh-chat-modes{flex-direction:column;width:30px;gap:3px}.dsh-chat-mode-compact .dsh-chat-modes button{width:24px;padding:4px 2px}
[data-dsh-chat-brand-fill="identity"]{flex:1;width:100%}
[data-dsh-chat-brand-fill="name"]{flex:1}
[data-dsh-chat-sidebar-mode="chat"] [data-dsh-chat-plugin-row="true"],
[data-dsh-chat-sidebar-mode="chat"] [data-dsh-chat-only-plugins="true"]{display:none}
[data-dsh-chat-sidebar-mode="chat"] [data-dsh-chat-new-session="true"]:disabled{opacity:.45;cursor:default}
.dsh-chat-brand-name{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%;flex:1;width:100%}
.dsh-chat-brand-wordmark{display:block;flex:0 1 102px;min-width:0;width:102px;height:24px;overflow:hidden}
.dsh-chat-brand-wordmark svg{display:block;width:156px;max-width:none;height:24px}
.dsh-chat-brand-anchor{display:block;width:112px;height:24px;flex:none;margin-left:auto;pointer-events:none}
.dsh-chat-brand-control{position:fixed;z-index:30;pointer-events:auto;display:flex;align-items:center;-webkit-app-region:no-drag}
.dsh-chat-brand-control .dsh-chat-modes{padding:2px;border-radius:5px;gap:1px}
.dsh-chat-brand-control .dsh-chat-mode-wrap,.dsh-chat-brand-control .dsh-chat-modes{width:100%}
.dsh-chat-brand-control .dsh-chat-modes button{flex:1}
.dsh-chat-brand-control .dsh-chat-modes button{font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);padding:4px 6px;min-height:22px;font-size:9px;letter-spacing:.2px;border-radius:3px}
.dsh-chat-authorization-notice{position:absolute;top:calc(100% + 6px);right:0;width:230px;max-width:calc(100vw - 24px);padding:10px 12px;z-index:40;border:1px solid var(--dsw-alias-border-l2,#dee1e8);border-radius:8px;background:var(--dsw-specific-sidebar-fill,#f4f5f8);box-shadow:0 4px 16px #0d1a3520;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-primary,#22242a)}
.dsh-chat-authorization-notice p{margin:0 0 5px}
.dsh-chat-navigation{display:flex;flex-direction:column;height:100%;min-height:0;background:transparent;color:inherit}
.dsh-chat-navigation-header{display:flex;align-items:center;justify-content:space-between;padding:0 14px 8px 16px;min-height:36px;color:var(--dsw-alias-label-secondary,#8b8d91);font-size:14px}
.dsh-chat-navigation-header>div{display:flex;gap:2px}
.dsh-chat-icon-button{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary,#8b8d91);cursor:pointer;font-size:21px!important}.dsh-chat-icon-button:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0d)}.dsh-chat-icon-button:disabled{opacity:.4;cursor:default}
.dsh-chat-navigation-search{margin:0 14px 8px;padding:7px 9px;min-width:0;border:1px solid var(--dsw-alias-border-l2,#85858b40);border-radius:6px;background:transparent;color:inherit;font:inherit;font-size:12px}
.dsh-chat-navigation-list{flex:1;min-height:0;overflow:auto;padding:0 12px 12px;scrollbar-width:thin}
.dsh-chat-conversation-group h3{font-size:12px;font-weight:400;color:var(--dsw-alias-label-secondary,#8b8d91);margin:15px 4px 6px}
.dsh-chat-conversation-row{display:block;width:100%;min-height:32px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:7px 10px;border:0;border-radius:8px;background:transparent;color:inherit;font-size:13px;cursor:pointer}.dsh-chat-conversation-row:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0d)}.dsh-chat-conversation-row[aria-current=page]{background:var(--dsw-alias-interactive-bg-active,#ffffff14)}
.dsh-chat-navigation-status{font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary,#8b8d91);padding:6px 4px}
.dsh-chat-navigation-rail{align-items:center;padding-top:6px}
.dsh-chat-text-button{padding:7px 4px;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#8b8d91);font-size:11px!important;cursor:pointer}
.dsh-chat-main-anchor{height:100%;min-width:0;width:100%;position:relative;background:var(--dsw-alias-bg-base,#fff)}
.dsh-chat-web-surface{position:fixed;z-index:20;pointer-events:auto;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#fff);overflow:hidden}
.dsh-chat-web-content{position:relative;flex:1;min-height:0;display:flex}.dsh-chat-webview{display:flex;width:100%;height:100%;flex:1;border:0}
.dsh-chat-web-status{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,calc(100% - 40px));text-align:center;padding:22px;border:1px solid var(--dsw-alias-border-l2,#e4e9f0);border-radius:12px;background:var(--dsw-alias-bg-base,#fff);font-size:12px;line-height:1.8;pointer-events:none}.dsh-chat-web-status strong{display:block;font-size:15px;font-weight:550;margin-bottom:9px}.dsh-chat-web-status p{color:var(--dsw-alias-label-secondary,#8190a2);margin:0}.dsh-chat-web-status-error{color:#a24f40}
.dsh-chat-unavailable{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}.dsh-chat-unavailable h2{font-size:20px;font-weight:550}.dsh-chat-unavailable p{color:var(--dsw-alias-label-secondary,#8190a2);font-size:12px}.dsh-chat-unavailable button{margin-top:18px;border:0;border-radius:8px;background:#4d6bfe;color:#fff;padding:10px 18px;cursor:pointer}
.dsh-chat-web-status button{pointer-events:auto;margin-top:12px}
.dsh-chat-leading{display:flex;align-items:center;gap:8px}
.dsh-chat-leading button{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;-webkit-app-region:no-drag}
.dsh-chat-leading button:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsh-chat-leading button:disabled{opacity:.4;cursor:default}
 .dsh-chat-settings{font-family:var(--dsw-font-family,system-ui);color:var(--dsw-alias-label-primary);font-size:14px;min-width:0}.dsh-chat-settings h2{margin:0 0 20px;font-size:20px}
.dsh-chat-settings-pane-hidden{height:1px!important;min-height:1px!important;background:transparent!important;overflow:hidden!important}.dsh-chat-settings-card{border:1px solid var(--dsw-alias-border-primary,#ffffff15);border-radius:12px;padding:24px;background:var(--dsw-alias-bg-base,#202124)}.dsh-chat-settings-language{display:flex;align-items:center;justify-content:space-between;gap:24px;border-top:1px solid #ffffff15;padding-top:20px}.dsh-chat-settings-language select{font:inherit;color:inherit;background:var(--dsw-alias-bg-base,#202124);border:1px solid #ffffff25;border-radius:8px;padding:8px 12px;min-width:140px}.dsh-chat-settings-account p,.dsh-chat-settings-progress{font-size:12px;color:var(--dsw-alias-label-secondary,#aaa)}
.dsh-chat-settings-pane{position:relative;height:min(500px,calc(100vh - 340px));min-height:220px;border-radius:12px;overflow:hidden;background:#292a2d}
.dsh-chat-settings-account{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}.dsh-chat-settings-account button{padding:8px 14px;border:1px solid #ff5f64;border-radius:8px;background:transparent;color:#ff5f64;cursor:pointer;font:inherit}.dsh-chat-settings-account button:disabled{opacity:.4;cursor:default}
.dsh-chat-settings-error{color:#ff8585;line-height:1.5;font-size:12px}
`
