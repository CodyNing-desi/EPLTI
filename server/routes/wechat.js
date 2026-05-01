import { Router } from 'express'
import crypto from 'crypto'

const router = Router()

const WECHAT_APP_ID = process.env.WECHAT_APP_ID || ''
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || ''

let cachedTicket = null
let ticketExpiresAt = 0

async function getJsApiTicket() {
  if (cachedTicket && Date.now() < ticketExpiresAt) {
    return cachedTicket
  }
  if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
    // If no credentials, return a mock ticket to prevent server crash
    return 'mock_ticket'
  }
  try {
    const tokenRes = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`)
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('Failed to get token')
    
    const ticketRes = await fetch(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${tokenData.access_token}&type=jsapi`)
    const ticketData = await ticketRes.json()
    if (!ticketData.ticket) throw new Error('Failed to get ticket')
    
    cachedTicket = ticketData.ticket
    ticketExpiresAt = Date.now() + 7000 * 1000 // 7000 seconds
    return cachedTicket
  } catch (e) {
    console.error('WeChat JSSDK ticket error:', e)
    return null
  }
}

router.get('/signature', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })
  
  const ticket = await getJsApiTicket()
  if (!ticket) return res.status(500).json({ error: 'Failed to get ticket' })

  const nonceStr = Math.random().toString(36).substring(2, 15)
  const timestamp = Math.floor(Date.now() / 1000)
  const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`
  const signature = crypto.createHash('sha1').update(str).digest('hex')

  res.json({
    appId: WECHAT_APP_ID,
    nonceStr,
    timestamp,
    signature
  })
})

export default router
