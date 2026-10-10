import { adaptWebsiteSettings } from '/adapter.js'
import { adaptWebsiteHeader } from '/header.js'
// Fictional public controls, no website requests, credentials or storage.
const results=[]
const check=(name,passed)=>results.push({name,passed:!!passed})
function fixture(initial='English', initialTheme='Dark') {
 const doc=document.implementation.createHTMLDocument('public settings fixture')
 doc.body.innerHTML='<div id="profile"><div role="button">Unrelated</div><div id="avatar"><img alt="avatar"></div></div>'
 doc.documentElement.setAttribute('data-dsh-chat-dark-complete','')
 let language=initial, theme=initialTheme, unrelated=0, danger=0, menus=0, logout=0
 doc.querySelector('[role=button]').onclick=()=>unrelated++
 doc.querySelector('#avatar').onclick=()=>{
  menus++
  const menu=doc.createElement('div');menu.className='ds-dropdown-menu'
  menu.innerHTML='<button>Settings</button><button>Log out</button>'
  menu.children[0].onclick=()=>{menu.remove();openModal()}
  menu.children[1].onclick=()=>{logout++;menu.remove()}
  doc.body.append(menu)
 }
 function openModal(){
  const modal=doc.createElement('div');modal.className='ds-modal-content'
  modal.innerHTML='<header>Settings<button><svg></svg></button></header><nav><div>General</div><div>Profile</div></nav><section><div><span>Language</span><button class="ds-button">Light</button><div class="ds-select" tabindex="0"><span>'+language+'</span><svg></svg></div></div><div id=theme><span>Theme</span><button aria-pressed=false>Light</button><button aria-pressed=false>Dark</button><button aria-pressed=false>System</button></div><button>Log out all devices</button><button>Delete account</button></section>'
  modal.querySelector('header button').onclick=()=>modal.remove()
  const themeControls=[...modal.querySelectorAll('#theme button')]
  const updateTheme=()=>themeControls.forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===theme)))
  themeControls.forEach(b=>b.onclick=()=>{theme=b.textContent;updateTheme()});updateTheme()
  modal.querySelectorAll('section > button').forEach(b=>b.onclick=()=>danger++)
  const select=modal.querySelector('.ds-select')
  select.querySelector('span').onpointerdown=()=>{
   if(doc.querySelector('[role=listbox]'))return
   const options=doc.createElement('div')
   for(const value of ['English','简体中文','System']){
    const button=doc.createElement('label');button.textContent=value
    button.onclick=()=>{language=value;select.querySelector('span').textContent=value;options.remove()}
    options.append(button)
   }
   doc.body.append(options)
  }
  doc.body.append(modal)
 }
 const step=command=>adaptWebsiteSettings(doc,doc.querySelector('#profile'),command)
 const poll=()=>step({type:'snapshot',showOriginal:false})
 const settle=()=>{for(let i=0;i<20;i++)poll();return poll()}
 return {doc,step,poll,settle,counts:()=>({unrelated,danger,menus,logout}),language:()=>language,theme:()=>theme}
}
const read=fixture();read.step({type:'settings-read'});const rs=read.settle()
check('reads actual language through the public profile menu',rs.language==='English' && !rs.pending && !rs.error)
check('uses avatar instead of unrelated role button',read.counts().menus===1 && read.counts().unrelated===0)
check('read closes the official settings modal',!read.doc.querySelector('.ds-modal-content'))
read.step({type:'setting',key:'language',value:'zh-CN'});const changed=read.settle()
check('native language command changes the website control',read.language()==='简体中文' && changed.language==='简体中文' && !changed.pending && !changed.error)
check('language operation never changes account/security data',read.counts().danger===0)
read.step({type:'logout'});read.settle()
check('logout invokes only the current-session menu item',read.counts().logout===1 && read.counts().danger===0)
const restore=fixture();restore.step({type:'preferences',language:'zh-CN'});const restored=restore.settle()
check('saved language restores through the website UI',restored.restored && restored.language==='简体中文' && !restored.pending)
const stale=fixture('English','Light');stale.step({type:'setting',key:'language',value:'zh-CN'});stale.settle()
check('language write repairs a stale dark completion marker',stale.theme()==='Dark')
const failedDark=fixture();failedDark.step({type:'preferences'});failedDark.doc.documentElement.setAttribute('data-dsh-chat-settings-deadline','1');failedDark.poll()
check('failed dark operation never marks dark complete',!failedDark.doc.documentElement.hasAttribute('data-dsh-chat-dark-complete'))
const deadline=fixture();deadline.step({type:'settings-read'});deadline.doc.documentElement.setAttribute('data-dsh-chat-settings-deadline','1');const expired=deadline.poll()
check('timeout stops pending and provides a retryable error',!expired.pending && expired.error && !/profile|DIV|diagnostic/.test(expired.error))
const headerFrame=document.createElement('iframe')
headerFrame.style.cssText='position:absolute;left:-9000px;width:800px;height:600px;border:0'
document.body.append(headerFrame)
const hd=headerFrame.contentDocument
hd.body.innerHTML='<main id="content"><header style="height:48px;width:500px;margin:auto;display:flex;align-items:center;justify-content:space-between"><span>Fictional title</span><button aria-label="Share"><svg width="16" height="16"></svg></button></header><textarea></textarea></main>'
const content=hd.querySelector('main')
let shares=0
hd.querySelector('button').onclick=()=>shares++
adaptWebsiteHeader(hd,content,'Fictional title',24)
const title=hd.querySelector('[data-dsh-chat-header-title]'), share=hd.querySelector('[data-dsh-chat-header-share]')
const expanded=title?.getBoundingClientRect(), shareRect=share?.getBoundingClientRect()
check('expanded header anchors title left and share right', expanded?.left===24 && expanded.top===0 && shareRect.right===788)
adaptWebsiteHeader(hd,content,'Fictional title',184)
const folded=title?.getBoundingClientRect()
check('collapsed header changes only horizontal title inset', folded?.left===184 && folded.top===expanded.top && folded.height===expanded.height)
check('header layout never invokes sharing', shares===0)
const multi=hd.createElement('section');multi.style.cssText='position:absolute;left:0;top:0;width:800px;height:60px'
multi.innerHTML='<div style="position:absolute;top:12px;left:150px;height:48px;text-align:center"><div style="width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Another title</div></div><button style="position:absolute;left:4px;top:10px;width:28px;height:28px"><svg></svg></button><button style="position:absolute;left:44px;top:10px;width:28px;height:28px"><svg></svg></button><button style="position:absolute;right:12px;top:10px;width:28px;height:28px"><svg></svg></button>'
hd.body.append(multi)
adaptWebsiteHeader(hd,hd.body,'Another title',24)
check('realistic compact navigation row locates unlabelled rightmost share',multi.querySelector('[data-dsh-chat-header-share]')===multi.querySelectorAll('button')[2] && multi.querySelector('[data-dsh-chat-header-title]')?.getBoundingClientRect().left===24)

adaptWebsiteHeader(hd,content,null,24)
check('new conversation removes stale header markers', !hd.querySelector('[data-dsh-chat-header-title],[data-dsh-chat-header-share],[data-dsh-chat-header-row]'))
headerFrame.remove()
document.querySelector('#results').textContent=JSON.stringify(results,null,2)
fetch('/results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(results)})
