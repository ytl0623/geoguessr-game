import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Trophy, MapPin, Play, Home, Map as MapIcon } from 'lucide-react';

// 預設位置庫
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

export default function GeoGuessrGame() {
  const [gameMode, setGameMode] = useState('menu'); 
  const [currentLocation, setCurrentLocation] = useState(null);
  const [guessLocation, setGuessLocation] = useState(null); // 儲存使用者點擊的座標 {lat, lng}
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastDistance, setLastDistance] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  
  // 多人遊戲狀態
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [multiRoomCode, setMultiRoomCode] = useState('');
  
  // Refs
  const panoramaRef = useRef(null); // 街景 DOM
  const guessMapRef = useRef(null); // 猜測地圖 DOM
  const mapInstanceRef = useRef(null); // 猜測地圖的 Google Map 實例
  const guessMarkerRef = useRef(null); // 使用者猜測的標記
  const correctMarkerRef = useRef(null); // 正確答案的標記
  const polylineRef = useRef(null); // 連接兩點的線

  // 計算兩點間距離（Haversine 公式）- 單位：公里
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 根據距離計算分數 (指數遞減，越近越高分)
  const calculateScore = (distance) => {
    // 5000 * e^(-distance / 2000) 是一個常見的算法
    // 距離 0km = 5000分
    // 距離 2000km ≈ 1800分
    // 距離 10000km ≈ 30分
    return Math.round(5000 * Math.exp(-distance / 2000));
  };

  // 初始化猜測地圖 (2D Map)
  const initGuessMap = () => {
    if (window.google && guessMapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(guessMapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        disableDefaultUI: true, // 簡化介面
        clickableIcons: false,
      });

      // 點擊地圖事件
      mapInstanceRef.current.addListener('click', (e) => {
        // 如果已經顯示結果，就不允許再點擊修改
        if (showResult) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setGuessLocation({ lat, lng });

        // 清除舊標記
        if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);

        // 新增紅色標記 (你的猜測)
        guessMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: {
             url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" // 紅色
          }
        });
      });
    }
  };

  // 開始新回合
  const startNewRound = () => {
    const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    setCurrentLocation(randomLocation);
    setGuessLocation(null);
    setShowResult(false);
    setLastDistance(null);
    setLastScore(null);
    
    // 清理地圖上的標記和線
    if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);
    if (correctMarkerRef.current) correctMarkerRef.current.setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);

    // 重置地圖視角
    if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: 0, lng: 0 });
        mapInstanceRef.current.setZoom(2);
    }

    // 稍微延遲以確保 DOM 已渲染
    setTimeout(() => {
        loadStreetView(randomLocation);
        initGuessMap(); // 確保猜測地圖也初始化
    }, 100);
  };

  // 載入街景
  const loadStreetView = (location) => {
    if (window.google && panoramaRef.current) {
      try {
        new window.google.maps.StreetViewPanorama(
          panoramaRef.current,
          {
            position: { lat: location.lat, lng: location.lng },
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
            disableDefaultUI: true,
            linksControl: false,
            panControl: false,
            enableCloseButton: false,
            showRoadLabels: false, 
          }
        );
      } catch (e) {
        console.error("地圖載入錯誤:", e);
      }
    }
  };

  // 提交猜測
  const submitGuess = () => {
    if (!guessLocation || !currentLocation) return;

    // 1. 計算距離
    const distance = calculateDistance(
        currentLocation.lat, 
        currentLocation.lng, 
        guessLocation.lat, 
        guessLocation.lng
    );
    
    // 2. 計算分數
    const roundScore = calculateScore(distance);
    
    setLastDistance(distance);
    setLastScore(roundScore);
    setScore(score + roundScore);
    setShowResult(true);

    // 3. 在地圖上顯示正確答案 (綠色標記)
    if (mapInstanceRef.current) {
        correctMarkerRef.current = new window.google.maps.Marker({
            position: { lat: currentLocation.lat, lng: currentLocation.lng },
            map: mapInstanceRef.current,
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" // 綠色
            }
        });

        // 4. 畫線連接兩點
        const lineCoordinates = [
            { lat: guessLocation.lat, lng: guessLocation.lng },
            { lat: currentLocation.lat, lng: currentLocation.lng }
        ];

        polylineRef.current = new window.google.maps.Polyline({
            path: lineCoordinates,
            geodesic: true, // 依地球曲率畫線
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });

        polylineRef.current.setMap(mapInstanceRef.current);

        // 5. 調整地圖縮放以同時顯示兩點
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: guessLocation.lat, lng: guessLocation.lng });
        bounds.extend({ lat: currentLocation.lat, lng: currentLocation.lng });
        mapInstanceRef.current.fitBounds(bounds);
    }

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

  // --- LocalStorage 多人連線邏輯 (與之前相同) ---
  const createRoom = () => {
    if (!playerName.trim()) { alert('請輸入玩家名稱！'); return; }
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
      localStorage.setItem(`room:${code}`, JSON.stringify(roomData));
      setPlayers([{ name: playerName, score: 0, ready: false }]);
      setGameMode('lobby');
    } catch (error) { console.error(error); }
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) { alert('請輸入資料！'); return; }
    try {
      const storedData = localStorage.getItem(`room:${roomCode.toUpperCase()}`);
      if (!storedData) { alert('房間不存在！'); return; }
      const roomData = JSON.parse(storedData);
      if (!roomData.players.find(p => p.name === playerName)) {
        roomData.players.push({ name: playerName, score: 0, ready: false });
        localStorage.setItem(`room:${roomCode.toUpperCase()}`, JSON.stringify(roomData));
      }
      setMultiRoomCode(roomCode.toUpperCase());
      setPlayers(roomData.players);
      setGameMode('lobby');
    } catch (error) { console.error(error); }
  };

  const updatePlayerScore = (roundScore) => {
    try {
      const storedData = localStorage.getItem(`room:${multiRoomCode}`);
      if (storedData) {
        const roomData = JSON.parse(storedData);
        const playerIndex = roomData.players.findIndex(p => p.name === playerName);
        if (playerIndex !== -1) {
          roomData.players[playerIndex].score += roundScore;
          localStorage.setItem(`room:${multiRoomCode}`, JSON.stringify(roomData));
        }
      }
    } catch (error) { console.error(error); }
  };

  const finalizeMultiGame = () => {
    try {
      const storedData = localStorage.getItem(`room:${multiRoomCode}`);
      if (storedData) {
        const roomData = JSON.parse(storedData);
        roomData.status = 'finished';
        localStorage.setItem(`room:${multiRoomCode}`, JSON.stringify(roomData));
        setPlayers(roomData.players);
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (gameMode === 'lobby' || gameMode === 'multi') {
        const interval = setInterval(() => {
            const storedData = localStorage.getItem(`room:${multiRoomCode}`);
            if (storedData) setPlayers(JSON.parse(storedData).players);
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [gameMode, multiRoomCode]);

  useEffect(() => {
    if (!window.google) {
        const script = document.createElement('script');
        // 請確保這裡有正確讀取 .env
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
  }, []);

  // --- UI Render ---

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Globe className="w-20 h-20 mx-auto mb-4 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">GeoGuessr</h1>
            <p className="text-gray-600">看街景，猜地圖！</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => { setGameMode('single'); startNewRound(); }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition"
            >
              <Play className="w-6 h-6" /> 單人遊戲
            </button>
            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" /> 多人連線 (本機)
              </h3>
              <input type="text" placeholder="輸入名稱" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full p-3 border rounded-lg mb-3" />
              <div className="space-y-2">
                <button onClick={createRoom} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">創建房間</button>
                <div className="flex gap-2">
                  <input type="text" placeholder="房間代碼" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} className="flex-1 p-3 border rounded-lg" maxLength={6} />
                  <button onClick={joinRoom} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition">加入</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameMode === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">遊戲大廳</h2>
            <p className="text-2xl font-mono font-bold text-blue-600">{multiRoomCode}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-gray-700 mb-3">玩家列表 ({players.length})</h3>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div key={i} className="bg-white p-3 rounded-lg flex justify-between"><span className="font-semibold">{p.name}</span></div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {isHost && <button onClick={() => { setGameMode('multi'); startNewRound(); }} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">開始遊戲</button>}
            <button onClick={() => { setGameMode('menu'); setMultiRoomCode(''); setPlayers([]); }} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition">離開</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const sortedPlayers = gameMode === 'multi' ? [...players].sort((a, b) => b.score - a.score) : [];
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">遊戲結束</h2>
            {gameMode === 'single' && <p className="text-5xl font-bold text-blue-600">{score} 分</p>}
          </div>
          {gameMode === 'multi' && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="space-y-2">
                {sortedPlayers.map((p, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg flex justify-between"><span className="font-semibold">{i+1}. {p.name}</span><span className="font-bold text-blue-600">{p.score}</span></div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => { setGameMode('menu'); setScore(0); setRound(1); setGameOver(false); }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"><Home className="w-5 h-5" /> 回主選單</button>
        </div>
      </div>
    );
  }

  // 遊戲畫面
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 頂部資訊 */}
      <div className="bg-white shadow-md p-4 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div><span className="text-sm text-gray-600">回合</span><p className="text-2xl font-bold text-blue-600">{round}/{maxRounds}</p></div>
            <div><span className="text-sm text-gray-600">分數</span><p className="text-2xl font-bold text-green-600">{score}</p></div>
          </div>
          <button onClick={() => setGameMode('menu')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">離開</button>
        </div>
      </div>

      {/* 遊戲區域：改為分割畫面 */}
      <div className="flex-1 flex flex-col md:flex-row h-full relative">
        
        {/* 左/上：街景 (占 70% 寬度) */}
        <div className="w-full md:w-[70%] h-[50vh] md:h-auto relative bg-black">
          <div ref={panoramaRef} className="w-full h-full">
            <div className="flex items-center justify-center h-full text-white">
                <p>載入街景中...</p>
            </div>
          </div>
          
          {/* 結果覆蓋層 (可選，顯示在街景上) */}
          {showResult && (
            <div className="absolute bottom-4 left-4 bg-white/90 p-4 rounded-xl shadow-lg backdrop-blur-sm z-10">
               <h3 className="font-bold text-lg mb-1">本局結果</h3>
               <p>距離誤差: <span className="font-bold text-red-500">{Math.round(lastDistance)} km</span></p>
               <p>本局得分: <span className="font-bold text-green-600">+{lastScore}</span></p>
               <button onClick={nextRound} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                 {round >= maxRounds ? '查看總分' : '下一回合'}
               </button>
            </div>
          )}
        </div>

        {/* 右/下：猜測地圖 (占 30% 寬度) */}
        <div className="w-full md:w-[30%] h-[40vh] md:h-auto relative border-l-4 border-white z-20 shadow-2xl">
           {/* 地圖容器 */}
           <div ref={guessMapRef} className="w-full h-full bg-gray-200 cursor-crosshair"></div>
           
           {/* 確認按鈕 (浮在地图下方) */}
           {!showResult && (
             <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-none">
               <button 
                 onClick={submitGuess}
                 disabled={!guessLocation}
                 className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl pointer-events-auto transition transform hover:scale-105 ${
                    guessLocation 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-800/50 text-gray-300 cursor-not-allowed'
                 }`}
               >
                 {guessLocation ? '確定猜測' : '點擊地圖選擇位置'}
               </button>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}