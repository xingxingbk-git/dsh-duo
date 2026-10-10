import test from 'node:test'
import assert from 'node:assert/strict'
import { parseWebsiteNavigation, websiteCommandScript } from '../src/website-navigation.js'

test('guest navigation response drops external/credential URLs and clears unsupported lists', () => {
  const conversation = (href: string) => ({href,title:'fixture',group:'昨天'})
  const value = {status:'ready',conversations:[conversation('https://chat.deepseek.com/a/chat/s/abc-123'),conversation('https://example.com/a/chat/s/a'),conversation('https://user:secret@chat.deepseek.com/a/chat/s/a'),conversation('https://chat.deepseek.com/a/chat/s/a?token=secret')],selectedHref:'https://example.com/',canCreate:true}
  assert.equal(parseWebsiteNavigation(value).conversations.length,1)
  assert.equal(parseWebsiteNavigation(value).selectedHref,null)
  assert.equal(parseWebsiteNavigation({...value,status:'sign-in'}).conversations.length,0)
  assert.equal(parseWebsiteNavigation({...value,status:'unsupported'}).canCreate,false)
})

test('serialized DOM adapter does not reference module helpers or privileged data sources', () => {
  const script = websiteCommandScript({type:'snapshot',showOriginal:false})
  assert.match(script,/\(document,location,/)
  assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|__webpack|emptyNavigation|parseWebsiteNavigation/)
})

// Guest data may be malformed or belong to the previous website login.
test('account and preference responses are bounded and discarded outside a ready session', () => {
  const payload={status:'ready',conversations:[],canCreate:true,accountName:'A'.repeat(200),settings:{language:'L'.repeat(160),theme:'Dark',error:'E'.repeat(400),pending:true}}
  const ready=parseWebsiteNavigation(payload)
  assert.equal(ready.accountName?.length,100)
  assert.equal(ready.settings?.language?.length,80)
  assert.equal(ready.settings?.error?.length,200)
  for (const status of ['sign-in','unsupported']) {
    const cleared=parseWebsiteNavigation({...payload,status})
    assert.equal(cleared.accountName,null)
    assert.equal(cleared.settings?.error?.length,200)
    assert.equal(cleared.canCreate,false)
  }
})

 test('loading keeps bounded settings errors while withholding account/history',()=>{
  const parsed=parseWebsiteNavigation({status:'loading',conversations:[],canCreate:true,accountName:'private fixture',settings:{error:'timeout',language:'English',restored:false,pending:true}})
  assert.equal(parsed.accountName,null);assert.equal(parsed.canCreate,false)
  assert.equal(parsed.settings?.error,'timeout');assert.equal(parsed.settings?.pending,true)
 })
