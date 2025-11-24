import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Trophy, MapPin, Play, Home, Map as MapIcon } from 'lucide-react';

// 預設位置庫
const LOCATIONS = [
  {"lat": 25.0339, "lng": 121.5644, "country": "台灣", "city": "台北 (101)"},
  {"lat": 22.6273, "lng": 120.2866, "country": "台灣", "city": "高雄 (駁二)"},
  {"lat": 24.1477, "lng": 120.6736, "country": "台灣", "city": "台中 (火車站)"},
  {"lat": 35.6586, "lng": 139.7454, "country": "日本", "city": "東京 (鐵塔)"},
  {"lat": 34.6937, "lng": 135.5023, "country": "日本", "city": "大阪 (中之島)"},
  {"lat": 35.0116, "lng": 135.7681, "country": "日本", "city": "京都 (鴨川)"},
  {"lat": 37.5665, "lng": 126.9780, "country": "韓國", "city": "首爾"},
  {"lat": 22.2855, "lng": 114.1577, "country": "香港", "city": "中環"},
  {"lat": 13.7563, "lng": 100.5018, "country": "泰國", "city": "曼谷"},
  {"lat": 1.2868, "lng": 103.8545, "country": "新加坡", "city": "魚尾獅公園"},
  {"lat": 48.8584, "lng": 2.2945, "country": "法國", "city": "巴黎 (艾菲爾鐵塔)"},
  {"lat": 51.5007, "lng": -0.1246, "country": "英國", "city": "倫敦 (大笨鐘)"},
  {"lat": 41.9028, "lng": 12.4964, "country": "義大利", "city": "羅馬 (競技場)"},
  {"lat": 45.4408, "lng": 12.3155, "country": "義大利", "city": "威尼斯"},
  {"lat": 52.5200, "lng": 13.4050, "country": "德國", "city": "柏林"},
  {"lat": 48.2082, "lng": 16.3738, "country": "奧地利", "city": "維也納"},
  {"lat": 50.0755, "lng": 14.4378, "country": "捷克", "city": "布拉格"},
  {"lat": 47.4979, "lng": 19.0402, "country": "匈牙利", "city": "布達佩斯"},
  {"lat": 41.3851, "lng": 2.1734, "country": "西班牙", "city": "巴塞隆納"},
  {"lat": 59.3293, "lng": 18.0686, "country": "瑞典", "city": "斯德哥爾摩"},
  {"lat": 55.7522, "lng": 37.6175, "country": "俄羅斯", "city": "莫斯科 (紅場)"},
  {"lat": 40.7580, "lng": -73.9855, "country": "美國", "city": "紐約 (時代廣場)"},
  {"lat": 37.8199, "lng": -122.4783, "country": "美國", "city": "舊金山 (金門大橋)"},
  {"lat": 36.1699, "lng": -115.1398, "country": "美國", "city": "拉斯維加斯"},
  {"lat": 41.8781, "lng": -87.6298, "country": "美國", "city": "芝加哥"},
  {"lat": 25.7617, "lng": -80.1918, "country": "美國", "city": "邁阿密"},
  {"lat": 34.0522, "lng": -118.2437, "country": "美國", "city": "洛杉磯"},
  {"lat": 49.2827, "lng": -123.1207, "country": "加拿大", "city": "溫哥華"},
  {"lat": 43.6532, "lng": -79.3832, "country": "加拿大", "city": "多倫多"},
  {"lat": 19.4326, "lng": -99.1332, "country": "墨西哥", "city": "墨西哥城"},
  {"lat": -22.9519, "lng": -43.2105, "country": "巴西", "city": "里約 (基督像)"},
  {"lat": -34.6037, "lng": -58.3816, "country": "阿根廷", "city": "布宜諾斯艾利斯"},
  {"lat": -33.4489, "lng": -70.6693, "country": "智利", "city": "聖地牙哥"},
  {"lat": -33.8568, "lng": 151.2153, "country": "澳洲", "city": "雪梨 (歌劇院)"},
  {"lat": -37.8136, "lng": 144.9631, "country": "澳洲", "city": "墨爾本"},
  {"lat": -36.8485, "lng": 174.7633, "country": "紐西蘭", "city": "奧克蘭"},
  {"lat": 30.0444, "lng": 31.2357, "country": "埃及", "city": "開羅"},
  {"lat": -33.9249, "lng": 18.4241, "country": "南非", "city": "開普敦"},
  {"lat": 25.1972, "lng": 55.2744, "country": "阿聯酋", "city": "杜拜 (哈里發塔)"},
  {"lat": 32.0853, "lng": 34.7818, "country": "以色列", "city": "特拉維夫"},
  {"lat": 41.0082, "lng": 28.9784, "country": "土耳其", "city": "伊斯坦堡"}
];

export default function GeoGuessrGame() {
  const [gameMode, setGameMode] = useState('menu'); 
  const [currentLocation, setCurrentLocation] = useState(null);
  const [guessLocation, setGuessLocation] = useState(null); 
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
  const panoramaRef = useRef(null); 
  const guessMapRef = useRef(null); 
  const mapInstanceRef = useRef(null); 
  const guessMarkerRef = useRef(null); 
  const correctMarkerRef = useRef(null); 
  const polylineRef = useRef(null); 

  // 計算距離
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

  // 計算分數
  const calculateScore = (distance) => {
    return Math.round(5000 * Math.exp(-distance / 2000));
  };

  // 初始化猜測地圖
  const initGuessMap = () => {
    if (window.google && guessMapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(guessMapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        disableDefaultUI: true, 
        clickableIcons: false,
      });

      mapInstanceRef.current.addListener('click', (e) => {
        if (showResult) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setGuessLocation({ lat, lng });

        if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);

        guessMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: {
             url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" 
          }
        });
      });
    }
  };

  const getRandomOffset = (lat, lng) => {
    const offset = 1; // 1 度約 111 公里
    const newLat = lat + (Math.random() - 0.5) * offset * 2;
    const newLng = lng + (Math.random() - 0.5) * offset * 2;
    return { lat: newLat, lng: newLng };
  };

  // 開始新回合
  const startNewRound = () => {
    const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    
    // 修正：這裡改成 randomLocation
    const randomOffset = getRandomOffset(randomLocation.lat, randomLocation.lng);

    const newLocation = {
        ...randomLocation,
        lat: randomOffset.lat,
        lng: randomOffset.lng
    };

    setCurrentLocation(newLocation);
    setGuessLocation(null);
    setShowResult(false);
    setLastDistance(null);
    setLastScore(null);
    
    if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);
    if (correctMarkerRef.current) correctMarkerRef.current.setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);

    if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: 0, lng: 0 });
        mapInstanceRef.current.setZoom(2);
    }

    setTimeout(() => {
        loadStreetView(newLocation);
        initGuessMap(); 
    }, 100);
  };

  // 修正後的載入街景：增加半徑搜尋，避免黑畫面
  const loadStreetView = (location) => {
    if (window.google && panoramaRef.current) {
      const sv = new window.google.maps.StreetViewService();
      
      // 搜尋半徑設為 50公里 (50000公尺)，確保能找到路
      sv.getPanorama({ location: { lat: location.lat, lng: location.lng }, radius: 50000 }, (data, status) => {
        if (status === 'OK') {
            // 如果找到了，使用找到的正確座標 (data.location.latLng)
            const panorama = new window.google.maps.StreetViewPanorama(
                panoramaRef.current,
                {
                  position: data.location.latLng,
                  pov: { heading: 165, pitch: 0 },
                  zoom: 1,
                  disableDefaultUI: true,
                  linksControl: false,
                  panControl: false,
                  enableCloseButton: false,
                  showRoadLabels: false, 
                }
            );
            
            // 重要：更新當前位置為「真正找到街景」的位置，不然算分會有誤差
            setCurrentLocation(prev => ({
                ...prev,
                lat: data.location.latLng.lat(),
                lng: data.location.latLng.lng()
            }));

        } else {
            console.error("此地點附近沒有街景:", status);
            // 如果真的找不到，為了不讓遊戲卡住，可以選擇重新 startNewRound() 或顯示提示
            // 這裡簡單處理：顯示錯誤訊息在街景上
            panoramaRef.current.innerHTML = '<div style="color:white; display:flex; justify-content:center; align-items:center; height:100%;">此隨機位置荒無人煙，沒有街景...<br/>(請重新整理或下一回合)</div>';
        }
      });
    }
  };

  // ... (以下程式碼保持不變)
  // 提交猜測
  const submitGuess = () => {
    if (!guessLocation || !currentLocation) return;

    const distance = calculateDistance(
        currentLocation.lat, 
        currentLocation.lng, 
        guessLocation.lat, 
        guessLocation.lng
    );
    
    const roundScore = calculateScore(distance);
    
    setLastDistance(distance);
    setLastScore(roundScore);
    setScore(score + roundScore);
    setShowResult(true);

    if (mapInstanceRef.current) {
        correctMarkerRef.current = new window.google.maps.Marker({
            position: { lat: currentLocation.lat, lng: currentLocation.lng },
            map: mapInstanceRef.current,
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" 
            }
        });

        const lineCoordinates = [
            { lat: guessLocation.lat, lng: guessLocation.lng },
            { lat: currentLocation.lat, lng: currentLocation.lng }
        ];

        polylineRef.current = new window.google.maps.Polyline({
            path: lineCoordinates,
            geodesic: true, 
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });

        polylineRef.current.setMap(mapInstanceRef.current);

        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: guessLocation.lat, lng: guessLocation.lng });
        bounds.extend({ lat: currentLocation.lat, lng: currentLocation.lng });
        mapInstanceRef.current.fitBounds(bounds);
    }

    if (gameMode === 'multi') {
      updatePlayerScore(roundScore);
    }
  };

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
              <Play className="w-6 h-6" /> 單人遊戲 (10回合)
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

      {/* 遊戲區域 */}
      <div className="flex-1 flex flex-col md:flex-row h-full relative">
        
        {/* 左/上：街景 (占 70% 寬度) */}
        <div className="w-full md:w-[70%] h-[50vh] md:h-auto relative bg-black">
          <div ref={panoramaRef} className="w-full h-full">
            <div className="flex items-center justify-center h-full text-white">
                <p>載入街景中...</p>
            </div>
          </div>
          
          {/* 結果覆蓋層 */}
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
           <div ref={guessMapRef} className="w-full h-full bg-gray-200 cursor-crosshair"></div>
           
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