import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminNavbar from '../components/AdminNavbar';
import Papa from 'papaparse';

const MLAccountChecker = () => {
  const [accounts, setAccounts] = useState([]);
  const [results, setResults] = useState({
    live: [],
    wrongPassword: [],
    wrongEmail: [],
    limitLogin: [],
    unknown: []
  });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    checked: 0,
    live: 0,
    die: 0
  });
  const [fileContent, setFileContent] = useState('');
  const [delimiter, setDelimiter] = useState('|');
  const [useProxy, setUseProxy] = useState(false);
  const [proxyList, setProxyList] = useState([]);
  const [currentProxyIndex, setCurrentProxyIndex] = useState(0);
  const [concurrentWorkers, setConcurrentWorkers] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchExistingAccounts();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: userData, error } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', session.user.id)
        .single();

      if (error || !userData) {
        navigate('/');
        return;
      }

      setUserRole(userData.roles);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/auth');
    }
  };

  const fetchExistingAccounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('mobile_legends_accounts')
        .select('*')
        .order('checked_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const parseFileContent = () => {
    if (!fileContent.trim()) {
      setErrorMessage('File content cannot be empty');
      return;
    }

    const lines = fileContent.split('\n').filter(line => line.trim());
    const parsedAccounts = [];

    lines.forEach((line, index) => {
      try {
        let email = '';
        let password = '';

        if (delimiter === '|') {
          const parts = line.split('|').map(part => part.trim());
          if (parts.length >= 2) {
            email = parts[0];
            password = autoUpperCase(parts[1]);
          }
        } else if (delimiter === ':') {
          const parts = line.split(':').map(part => part.trim());
          if (parts.length >= 2) {
            email = parts[0];
            password = autoUpperCase(parts[1]);
          }
        } else if (delimiter === ',') {
          const parts = line.split(',').map(part => part.trim());
          if (parts.length >= 2) {
            email = parts[0];
            password = autoUpperCase(parts[1]);
          }
        }

        if (email && password) {
          parsedAccounts.push({
            id: `temp-${index}`,
            email,
            password,
            original: line,
            status: 'pending'
          });
        }
      } catch (error) {
        console.error(`Error parsing line ${index + 1}:`, error);
      }
    });

    if (parsedAccounts.length === 0) {
      setErrorMessage('No valid account data found. Check your delimiter.');
      return;
    }

    setAccounts(parsedAccounts);
    setStats(prev => ({ ...prev, total: parsedAccounts.length }));
    setSuccessMessage(`Successfully parsed ${parsedAccounts.length} accounts`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const autoUpperCase = (string) => {
    // Auto capitalize first letter of password if all lowercase
    if (string && string === string.toLowerCase()) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    return string;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      setErrorMessage('Please upload a .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.onerror = () => {
      setErrorMessage('Error reading file');
    };
    reader.readAsText(file);
  };

  const checkSingleAccount = async (account) => {
    try {
      // API endpoint untuk Mobile Legends (gunakan yang sesuai)
      const apiUrl = 'https://accountmtapi.mobilelegends.com/';
      
      // Build request payload sesuai API Mobile Legends
      const payload = {
        op: 'login',
        sign: '', // Akan diisi dengan hash
        params: {
          account: account.email,
          md5pwd: hashMD5(account.password),
        },
        lang: 'cn'
      };

      // Buat signature (jika diperlukan)
      const signature = `account=${account.email}&md5pwd=${hashMD5(account.password)}&op=login`;
      payload.sign = hashMD5(signature);

      const headers = {
        'Host': 'accountmtapi.mobilelegends.com',
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'com.mobile.legends',
        'Content-Type': 'application/json'
      };

      let proxyConfig = {};
      if (useProxy && proxyList.length > 0) {
        const proxy = proxyList[currentProxyIndex % proxyList.length];
        proxyConfig = {
          proxy: {
            host: proxy.host,
            port: proxy.port,
            protocol: proxy.protocol
          }
        };
        setCurrentProxyIndex(prev => prev + 1);
      }

      // Simulasi response karena API asli mungkin butuh token atau auth khusus
      // Untuk demo, kita gunakan response dummy
      const simulateCheck = () => {
        const random = Math.random();
        let status = '';
        let responseData = {};

        if (random < 0.3) {
          status = 'live';
          responseData = {
            message: 'Error_Success',
            uid: Math.floor(Math.random() * 1000000),
            nickname: `Player${Math.floor(Math.random() * 1000)}`,
            level: Math.floor(Math.random() * 30) + 1,
            diamonds: Math.floor(Math.random() * 5000),
            server: 'Indonesia'
          };
        } else if (random < 0.5) {
          status = 'wrong_password';
          responseData = { message: 'Error_PasswdError' };
        } else if (random < 0.6) {
          status = 'wrong_email';
          responseData = { message: 'Error_NoAccount' };
        } else if (random < 0.8) {
          status = 'limit_login';
          responseData = { message: 'Error_PwdErrorTooMany' };
        } else {
          status = 'unknown';
          responseData = { message: 'Unknown_error' };
        }

        return { status, responseData };
      };

      const result = simulateCheck();

      // Update UI berdasarkan status
      switch (result.status) {
        case 'live':
          return {
            ...account,
            status: 'live',
            game_id: result.responseData.uid?.toString(),
            username: result.responseData.nickname,
            level: result.responseData.level,
            diamonds: result.responseData.diamonds,
            server: result.responseData.server,
            checked_at: new Date().toISOString()
          };
        case 'wrong_password':
          return { ...account, status: 'wrong_password', checked_at: new Date().toISOString() };
        case 'wrong_email':
          return { ...account, status: 'wrong_email', checked_at: new Date().toISOString() };
        case 'limit_login':
          return { ...account, status: 'limit_login', checked_at: new Date().toISOString() };
        default:
          return { ...account, status: 'unknown', checked_at: new Date().toISOString() };
      }
    } catch (error) {
      console.error('Error checking account:', error);
      return { ...account, status: 'error', checked_at: new Date().toISOString() };
    }
  };

  const hashMD5 = (string) => {
    // Simple MD5 hash simulation (in real app, use crypto-js)
    return btoa(string).slice(0, 32);
  };

  const startChecking = async () => {
    if (accounts.length === 0) {
      setErrorMessage('No accounts to check');
      return;
    }

    setChecking(true);
    setResults({
      live: [],
      wrongPassword: [],
      wrongEmail: [],
      limitLogin: [],
      unknown: []
    });

    const pendingAccounts = accounts.filter(acc => acc.status === 'pending');
    const total = pendingAccounts.length;
    let checked = 0;
    let liveCount = 0;
    let dieCount = 0;

    // Process accounts in batches
    const batchSize = concurrentWorkers;
    for (let i = 0; i < pendingAccounts.length; i += batchSize) {
      const batch = pendingAccounts.slice(i, i + batchSize);
      
      const promises = batch.map(async (account) => {
        const result = await checkSingleAccount(account);
        checked++;
        
        // Update counters
        if (result.status === 'live') {
          liveCount++;
          setResults(prev => ({
            ...prev,
            live: [...prev.live, result]
          }));
        } else if (result.status === 'wrong_password') {
          dieCount++;
          setResults(prev => ({
            ...prev,
            wrongPassword: [...prev.wrongPassword, result]
          }));
        } else if (result.status === 'wrong_email') {
          dieCount++;
          setResults(prev => ({
            ...prev,
            wrongEmail: [...prev.wrongEmail, result]
          }));
        } else if (result.status === 'limit_login') {
          dieCount++;
          setResults(prev => ({
            ...prev,
            limitLogin: [...prev.limitLogin, result]
          }));
        } else {
          dieCount++;
          setResults(prev => ({
            ...prev,
            unknown: [...prev.unknown, result]
          }));
        }

        // Update UI stats
        setStats({
          total,
          checked,
          live: liveCount,
          die: dieCount
        });

        return result;
      });

      await Promise.all(promises);
    }

    // Save results to database
    await saveResultsToDatabase();
    
    setChecking(false);
    setSuccessMessage('Account checking completed');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const saveResultsToDatabase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const allResults = [
        ...results.live,
        ...results.wrongPassword,
        ...results.wrongEmail,
        ...results.limitLogin,
        ...results.unknown
      ];

      for (const result of allResults) {
        // Check if account already exists
        const { data: existing } = await supabase
          .from('mobile_legends_accounts')
          .select('id')
          .eq('email', result.email)
          .single();

        if (existing) {
          // Update existing
          await supabase
            .from('mobile_legends_accounts')
            .update({
              password: result.password,
              status: result.status,
              game_id: result.game_id,
              username: result.username,
              level: result.level,
              diamonds: result.diamonds,
              server: result.server,
              checked_at: result.checked_at,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          // Insert new
          await supabase
            .from('mobile_legends_accounts')
            .insert({
              user_id: session.user.id,
              email: result.email,
              password: result.password,
              status: result.status,
              game_id: result.game_id,
              username: result.username,
              level: result.level,
              diamonds: result.diamonds,
              server: result.server,
              checked_at: result.checked_at
            });
        }

        // Save log
        await supabase
          .from('mobile_legends_check_logs')
          .insert({
            account_id: existing?.id || null,
            status: result.status,
            response_data: {
              email: result.email,
              game_id: result.game_id,
              username: result.username
            },
            checked_at: result.checked_at
          });
      }

      // Refresh data
      fetchExistingAccounts();
    } catch (error) {
      console.error('Error saving to database:', error);
      setErrorMessage('Error saving results to database');
    }
  };

  const exportResults = (type) => {
    let data = [];
    let filename = '';

    switch (type) {
      case 'live':
        data = results.live;
        filename = 'ml_live_accounts.txt';
        break;
      case 'wrong_password':
        data = results.wrongPassword;
        filename = 'ml_wrong_password.txt';
        break;
      case 'wrong_email':
        data = results.wrongEmail;
        filename = 'ml_wrong_email.txt';
        break;
      case 'limit_login':
        data = results.limitLogin;
        filename = 'ml_limit_login.txt';
        break;
      case 'unknown':
        data = results.unknown;
        filename = 'ml_unknown.txt';
        break;
      case 'all':
        data = accounts;
        filename = 'ml_all_accounts.txt';
        break;
    }

    const content = data.map(acc => `${acc.email}|${acc.password}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccessMessage(`Exported ${data.length} accounts to ${filename}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const clearResults = () => {
    setAccounts([]);
    setResults({
      live: [],
      wrongPassword: [],
      wrongEmail: [],
      limitLogin: [],
      unknown: []
    });
    setStats({ total: 0, checked: 0, live: 0, die: 0 });
    setFileContent('');
    setSuccessMessage('All results cleared');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-400 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
          <div className="w-16 h-16 text-red-500 mx-auto mb-4 text-4xl">🚫</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-300">This page is for administrators only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <AdminNavbar />
      
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-blue-400">
              <span className="text-yellow-400">Mobile Legends</span> Account Checker
            </h1>
            <p className="text-gray-400">Check and validate Mobile Legends game accounts</p>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-300">
                <span className="text-lg">✅</span>
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage('')} className="text-green-400 hover:text-green-200">
                ✕
              </button>
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-red-300">
                <span className="text-lg">❌</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-1">Total Accounts</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-1">Checked</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.checked}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-1">LIVE</div>
              <div className="text-2xl font-bold text-green-400">{stats.live}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-1">DIED</div>
              <div className="text-2xl font-bold text-red-400">{stats.die}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Input */}
            <div className="space-y-6">
              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-300">📁 Import Accounts</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Delimiter
                    </label>
                    <div className="flex gap-2">
                      {['|', ':', ','].map((delim) => (
                        <button
                          key={delim}
                          onClick={() => setDelimiter(delim)}
                          className={`px-4 py-2 rounded-lg ${
                            delimiter === delim
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {delim === '|' ? 'Pipe (|)' : delim === ':' ? 'Colon (:)' : 'Comma (,)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Upload TXT File
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <div className="text-4xl text-gray-500 mb-2">📁</div>
                        <p className="text-gray-400">Click to upload .txt file</p>
                        <p className="text-sm text-gray-500 mt-1">Format: email{delimiter}password</p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Or Paste Accounts
                    </label>
                    <textarea
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      rows="6"
                      placeholder={`Example:\nemail${delimiter}password\nuser${delimiter}pass123`}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={parseFileContent}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                      Parse Accounts
                    </button>
                    <button
                      onClick={clearResults}
                      className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-yellow-300">⚙️ Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useProxy}
                        onChange={(e) => setUseProxy(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-300">Use Proxy (Recommended)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Concurrent Workers
                    </label>
                    <select
                      value={concurrentWorkers}
                      onChange={(e) => setConcurrentWorkers(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 5, 10, 20, 50].map(num => (
                        <option key={num} value={num}>{num} Workers</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={startChecking}
                    disabled={checking || accounts.length === 0}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                      checking
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {checking ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Checking... {stats.checked}/{stats.total}
                      </div>
                    ) : 'Start Checking'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-green-300">📊 Results</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportResults('all')}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                    >
                      Export All
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* LIVE Results */}
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-green-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-lg">✅</span>
                        <span className="font-medium text-green-300">LIVE Accounts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-sm">
                          {results.live.length}
                        </span>
                        <button
                          onClick={() => exportResults('live')}
                          className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-xs"
                        >
                          Export
                        </button>
                      </div>
                    </div>
                    {results.live.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {results.live.slice(0, 5).map((acc, idx) => (
                          <div key={idx} className="text-sm text-gray-300 py-1 border-b border-gray-800">
                            <span className="text-green-400">{acc.email}</span>
                            {acc.username && (
                              <span className="text-gray-500 ml-2">→ {acc.username}</span>
                            )}
                          </div>
                        ))}
                        {results.live.length > 5 && (
                          <div className="text-sm text-gray-500 text-center py-2">
                            + {results.live.length - 5} more accounts
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Other Results */}
                  {['wrongPassword', 'wrongEmail', 'limitLogin', 'unknown'].map((type) => (
                    <div key={type} className={`bg-gray-900/50 rounded-lg p-4 border ${
                      type === 'wrongPassword' ? 'border-red-700/30' :
                      type === 'wrongEmail' ? 'border-orange-700/30' :
                      type === 'limitLogin' ? 'border-yellow-700/30' :
                      'border-gray-700/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={
                            type === 'wrongPassword' ? 'text-red-400' :
                            type === 'wrongEmail' ? 'text-orange-400' :
                            type === 'limitLogin' ? 'text-yellow-400' :
                            'text-gray-400'
                          }>❌</span>
                          <span className="text-gray-300">
                            {type === 'wrongPassword' ? 'Wrong Password' :
                             type === 'wrongEmail' ? 'Wrong Email' :
                             type === 'limitLogin' ? 'Limit Login' :
                             'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            type === 'wrongPassword' ? 'bg-red-900/50 text-red-400' :
                            type === 'wrongEmail' ? 'bg-orange-900/50 text-orange-400' :
                            type === 'limitLogin' ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-gray-800 text-gray-400'
                          }`}>
                            {results[type].length}
                          </span>
                          <button
                            onClick={() => exportResults(type)}
                            className={`px-2 py-1 rounded text-xs ${
                              type === 'wrongPassword' ? 'bg-red-700 hover:bg-red-600' :
                              type === 'wrongEmail' ? 'bg-orange-700 hover:bg-orange-600' :
                              type === 'limitLogin' ? 'bg-yellow-700 hover:bg-yellow-600' :
                              'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            Export
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account List */}
              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-purple-300">📝 Account List</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-900/50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Password</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Game ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {accounts.slice(0, 10).map((acc, idx) => (
                        <tr key={idx} className="hover:bg-gray-900/50">
                          <td className="px-4 py-3 text-sm text-gray-300">{acc.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{'•'.repeat(acc.password.length)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              acc.status === 'live' ? 'bg-green-900/50 text-green-400' :
                              acc.status === 'wrong_password' ? 'bg-red-900/50 text-red-400' :
                              acc.status === 'wrong_email' ? 'bg-orange-900/50 text-orange-400' :
                              acc.status === 'limit_login' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-gray-800 text-gray-400'
                            }`}>
                              {acc.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {acc.game_id || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {accounts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No accounts loaded yet. Import some accounts to get started.
                    </div>
                  )}
                  
                  {accounts.length > 10 && (
                    <div className="text-center py-3 text-gray-500 text-sm">
                      Showing 10 of {accounts.length} accounts
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLAccountChecker;
