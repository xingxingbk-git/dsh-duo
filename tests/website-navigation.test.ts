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
