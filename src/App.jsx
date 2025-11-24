import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Trophy, MapPin, Play, Home } from 'lucide-react';

// 預設位置庫（世界各地的有趣位置）
const LOCATIONS = [
  { lat: 48.8584, lng: 2.2945, country: '法國', city: '巴黎' },
  { lat: 35.6762, lng: 139.6503, country: '日本', city: '東京' },
  { lat: 40.7128, lng: -74.0060, country: '美國', city: '紐約' },
  { lat: 51.5074, lng: -0.1278, country: '英國', city: '倫敦' },
  { lat: -33.8688, lng: 151.2093, country: '澳洲', city: '雪梨' },
  { lat: 41.9028, lng: 12.4964, country: '義大利', city: '羅馬' },
  { lat: 25.0330, lng: 121.5654, country: '台灣', city: '台北' },
  { lat: 55.7558, lng: 37.6173, country: '俄羅斯', city: '莫斯科' },
  { lat: -22.9068, lng: -43.1729, country: '巴西', city: '里約' },
  { lat: 30.0444, lng: 31.2357, country: '埃及', city: '開羅' },
];

const ALL_COUNTRIES = ['法國', '日本', '美國', '英國', '澳洲', '義大利', '台灣', '俄羅斯', '巴西', '埃及', '德國', '西班牙', '加拿大', '中國', '印度', '韓國', '泰國', '越南', '新加坡', '馬來西亞', '印尼', '菲律賓', '墨西哥', '阿根廷', '智利', '哥倫比亞', '秘魯', '南非', '肯亞', '摩洛哥', '土耳其', '希臘', '瑞士', '瑞典', '挪威', '丹麥', '芬蘭', '波蘭', '捷克', '荷蘭', '比利時', '奧地利', '葡萄牙', '愛爾蘭', '紐西蘭', '以色列', '阿聯酋', '沙烏地阿拉伯', '巴基斯坦', '孟加拉'];

// 隨機選擇國家（包含正確答案）
const getRandomCountries = (correctCountry) => {
  const countries = [correctCountry];
  const otherCountries = ALL_COUNTRIES.filter(c => c !== correctCountry);
  
  // 隨機選擇其他9個國家
  while (countries.length < 10) {
    const randomIndex = Math.floor(Math.random() * otherCountries.length);
    const country = otherCountries[randomIndex];
    if (!countries.includes(country)) {
      countries.push(country);
    }
  }
  
  // 打亂順序
  return countries.sort(() => Math.random() - 0.5);
};

export default function GeoGuessrGame() {
  const [gameMode, setGameMode] = useState('menu'); // menu, single, multi, lobby
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastDistance, setLastDistance] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);
  
  // 多人遊戲狀態
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [multiRoomCode, setMultiRoomCode] = useState('');
  
  const panoramaRef = useRef(null);
  const mapRef = useRef(null);

  // 計算兩點間距離（Haversine 公式）
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球半徑（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 根據距離計算分數
  const calculateScore = (distance) => {
    if (distance < 100) return 5000;
    if (distance < 500) return 4000;
    if (distance < 1000) return 3000;
    if (distance < 2000) return 2000;
    if (distance < 5000) return 1000;
    return 500;
  };

  // 開始新回合
  const startNewRound = () => {
    const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    setCurrentLocation(randomLocation);
    setSelectedCountry('');
    setShowResult(false);
    setLastDistance(null);
    setLastScore(null);
    setCountryOptions(getRandomCountries(randomLocation.country));
    loadStreetView(randomLocation);
  };

  // 載入街景
  const loadStreetView = (location) => {
    if (window.google && panoramaRef.current) {
      const panorama = new window.google.maps.StreetViewPanorama(
        panoramaRef.current,
        {
          position: { lat: location.lat, lng: location.lng },
          pov: { heading: 165, pitch: 0 },
          zoom: 1,
          disableDefaultUI: true,
          linksControl: false,
          panControl: false,
          enableCloseButton: false,
        }
      );
    }
  };

  // 提交猜測
  const submitGuess = () => {
    if (!selectedCountry || !currentLocation) return;

    const isCorrect = selectedCountry === currentLocation.country;
    const distance = isCorrect ? 0 : Math.random() * 10000; // 簡化版本
    const roundScore = calculateScore(distance);
    
    setLastDistance(distance);
    setLastScore(roundScore);
    setScore(score + roundScore);
    setShowResult(true);

    if (gameMode === 'multi') {
      updatePlayerScore(roundScore);
    }
  };

  // 下一回合
  const nextRound = () => {
    if (round >= maxRounds) {
      setGameOver(true);
      if (gameMode === 'multi') {
        finalizeMultiGame();
      }
    } else {
      setRound(round + 1);
      startNewRound();
    }
  };

  // 重新開始
  const restartGame = () => {
    setScore(0);
    setRound(1);
    setGameOver(false);
    startNewRound();
  };

  // 創建多人房間
  const createRoom = async () => {
    if (!playerName.trim()) {
      alert('請輸入玩家名稱！');
      return;
    }
    
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    setMultiRoomCode(code);
    setIsHost(true);
    
    try {
      const roomData = {
        host: playerName,
        players: [{ name: playerName, score: 0, ready: false }],
        round: 1,
        location: LOCATIONS[0],
        status: 'waiting'
      };
      
      await window.storage.set(`room:${code}`, JSON.stringify(roomData), true);
      setPlayers([{ name: playerName, score: 0, ready: false }]);
      setGameMode('lobby');
    } catch (error) {
      console.error('創建房間失敗:', error);
      alert('創建房間失敗，請重試');
    }
  };

  // 加入房間
  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      alert('請輸入玩家名稱和房間代碼！');
      return;
    }
    
    try {
      const result = await window.storage.get(`room:${roomCode.toUpperCase()}`, true);
      if (!result) {
        alert('房間不存在！');
        return;
      }
      
      const roomData = JSON.parse(result.value);
      roomData.players.push({ name: playerName, score: 0, ready: false });
      
      await window.storage.set(`room:${roomCode.toUpperCase()}`, JSON.stringify(roomData), true);
      setMultiRoomCode(roomCode.toUpperCase());
      setPlayers(roomData.players);
      setGameMode('lobby');
    } catch (error) {
      console.error('加入房間失敗:', error);
      alert('加入房間失敗，請重試');
    }
  };

  // 更新玩家分數
  const updatePlayerScore = async (roundScore) => {
    try {
      const result = await window.storage.get(`room:${multiRoomCode}`, true);
      if (result) {
        const roomData = JSON.parse(result.value);
        const playerIndex = roomData.players.findIndex(p => p.name === playerName);
        if (playerIndex !== -1) {
          roomData.players[playerIndex].score += roundScore;
          await window.storage.set(`room:${multiRoomCode}`, JSON.stringify(roomData), true);
        }
      }
    } catch (error) {
      console.error('更新分數失敗:', error);
    }
  };

  // 完成多人遊戲
  const finalizeMultiGame = async () => {
    try {
      const result = await window.storage.get(`room:${multiRoomCode}`, true);
      if (result) {
        const roomData = JSON.parse(result.value);
        roomData.status = 'finished';
        await window.storage.set(`room:${multiRoomCode}`, JSON.stringify(roomData), true);
        setPlayers(roomData.players);
      }
    } catch (error) {
      console.error('完成遊戲失敗:', error);
    }
  };

  // 載入 Google Maps API
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCjemnCwOQjza_pPcp7ySClyzqXgY-mwa8`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 主選單
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Globe className="w-20 h-20 mx-auto mb-4 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">地理猜測</h1>
            <p className="text-gray-600">猜猜這是哪個國家？</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                setGameMode('single');
                startNewRound();
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition"
            >
              <Play className="w-6 h-6" />
              單人遊戲
            </button>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                多人連線
              </h3>
              
              <input
                type="text"
                placeholder="輸入你的名稱"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-3 border rounded-lg mb-3"
              />
              
              <div className="space-y-2">
                <button
                  onClick={createRoom}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  創建房間
                </button>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="房間代碼"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 p-3 border rounded-lg"
                    maxLength={6}
                  />
                  <button
                    onClick={joinRoom}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    加入
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 大廳
  if (gameMode === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">遊戲大廳</h2>
            <p className="text-2xl font-mono font-bold text-blue-600">房間代碼: {multiRoomCode}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              玩家列表 ({players.length})
            </h3>
            <div className="space-y-2">
              {players.map((player, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg flex justify-between items-center">
                  <span className="font-semibold">{player.name}</span>
                  <span className="text-sm text-gray-500">
                    {player.name === playerName && '(你)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            {isHost && (
              <button
                onClick={() => {
                  setGameMode('multi');
                  startNewRound();
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                開始遊戲
              </button>
            )}
            
            <button
              onClick={() => {
                setGameMode('menu');
                setMultiRoomCode('');
                setPlayers([]);
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              離開房間
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 遊戲結束
  if (gameOver) {
    const sortedPlayers = gameMode === 'multi' ? [...players].sort((a, b) => b.score - a.score) : [];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">遊戲結束！</h2>
            {gameMode === 'single' && (
              <p className="text-5xl font-bold text-blue-600">{score} 分</p>
            )}
          </div>
          
          {gameMode === 'multi' && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-700 mb-3">排行榜</h3>
              <div className="space-y-2">
                {sortedPlayers.map((player, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                      </span>
                      <span className="font-semibold">{player.name}</span>
                    </div>
                    <span className="font-bold text-blue-600">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setGameMode('menu');
                setScore(0);
                setRound(1);
                setGameOver(false);
                setMultiRoomCode('');
                setPlayers([]);
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Home className="w-5 h-5" />
              回到主選單
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 遊戲進行中
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 頂部資訊欄 */}
      <div className="bg-white shadow-md p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-gray-600">回合</span>
              <p className="text-2xl font-bold text-blue-600">{round}/{maxRounds}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">分數</span>
              <p className="text-2xl font-bold text-green-600">{score}</p>
            </div>
            {gameMode === 'multi' && (
              <div>
                <span className="text-sm text-gray-600">房間</span>
                <p className="text-lg font-mono font-bold">{multiRoomCode}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              setGameMode('menu');
              setScore(0);
              setRound(1);
              setGameOver(false);
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
          >
            離開遊戲
          </button>
        </div>
      </div>

      {/* 主遊戲區域 */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* 街景視圖 */}
        <div className="flex-1 relative bg-gray-800">
          <div ref={panoramaRef} className="w-full h-full min-h-[400px]">
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <Globe className="w-16 h-16 mx-auto mb-4 animate-spin" />
                <p>載入街景中...</p>
                <p className="text-sm text-gray-400 mt-2">需要 Google Maps API Key</p>
              </div>
            </div>
          </div>
        </div>

        {/* 猜測面板 */}
        <div className="w-full lg:w-96 bg-white p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-500" />
            選擇國家
          </h3>
          
          <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
            {countryOptions.map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                disabled={showResult}
                className={`w-full p-3 rounded-lg text-left transition ${
                  selectedCountry === country
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                } ${showResult ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {country}
              </button>
            ))}
          </div>

          {showResult && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">結果</h4>
              <p className="text-sm text-gray-600">
                正確答案: <span className="font-bold">{currentLocation.country}</span>
              </p>
              <p className="text-sm text-gray-600">
                你的猜測: <span className="font-bold">{selectedCountry}</span>
              </p>
              <p className="text-lg font-bold text-green-600 mt-2">
                +{lastScore} 分
              </p>
            </div>
          )}

          {!showResult ? (
            <button
              onClick={submitGuess}
              disabled={!selectedCountry}
              className={`w-full font-bold py-3 px-6 rounded-lg transition ${
                selectedCountry
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              提交答案
            </button>
          ) : (
            <button
              onClick={nextRound}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {round >= maxRounds ? '查看結果' : '下一回合'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}