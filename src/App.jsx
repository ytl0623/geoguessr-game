import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Trophy, MapPin, Play, Home, Map as MapIcon, CheckCircle, Clock } from 'lucide-react';
// Import Firebase
import { db } from './firebase';
import { ref, set, onValue, update, get } from "firebase/database";

// Default Locations Database
const LOCATIONS = [
  {"lat": 25.0339, "lng": 121.5644, "country": "Taiwan", "city": "Taipei (101)"},
  {"lat": 22.6273, "lng": 120.2866, "country": "Taiwan", "city": "Kaohsiung (Pier-2)"},
  {"lat": 24.1477, "lng": 120.6736, "country": "Taiwan", "city": "Taichung (Station)"},
  {"lat": 35.6586, "lng": 139.7454, "country": "Japan", "city": "Tokyo (Tower)"},
  {"lat": 34.6937, "lng": 135.5023, "country": "Japan", "city": "Osaka (Nakanoshima)"},
  {"lat": 35.0116, "lng": 135.7681, "country": "Japan", "city": "Kyoto (Kamo River)"},
  {"lat": 37.5665, "lng": 126.9780, "country": "South Korea", "city": "Seoul"},
  {"lat": 22.2855, "lng": 114.1577, "country": "Hong Kong", "city": "Central"},
  {"lat": 13.7563, "lng": 100.5018, "country": "Thailand", "city": "Bangkok"},
  {"lat": 1.2868, "lng": 103.8545, "country": "Singapore", "city": "Merlion Park"},
  {"lat": 48.8584, "lng": 2.2945, "country": "France", "city": "Paris (Eiffel Tower)"},
  {"lat": 51.5007, "lng": -0.1246, "country": "UK", "city": "London (Big Ben)"},
  {"lat": 41.9028, "lng": 12.4964, "country": "Italy", "city": "Rome (Colosseum)"},
  {"lat": 45.4408, "lng": 12.3155, "country": "Italy", "city": "Venice"},
  {"lat": 52.5200, "lng": 13.4050, "country": "Germany", "city": "Berlin"},
  {"lat": 48.2082, "lng": 16.3738, "country": "Austria", "city": "Vienna"},
  {"lat": 50.0755, "lng": 14.4378, "country": "Czech Republic", "city": "Prague"},
  {"lat": 47.4979, "lng": 19.0402, "country": "Hungary", "city": "Budapest"},
  {"lat": 41.3851, "lng": 2.1734, "country": "Spain", "city": "Barcelona"},
  {"lat": 59.3293, "lng": 18.0686, "country": "Sweden", "city": "Stockholm"},
  {"lat": 55.7522, "lng": 37.6175, "country": "Russia", "city": "Moscow (Red Square)"},
  {"lat": 40.7580, "lng": -73.9855, "country": "USA", "city": "New York (Times Square)"},
  {"lat": 37.8199, "lng": -122.4783, "country": "USA", "city": "San Francisco (Golden Gate)"},
  {"lat": 36.1699, "lng": -115.1398, "country": "USA", "city": "Las Vegas"},
  {"lat": 41.8781, "lng": -87.6298, "country": "USA", "city": "Chicago"},
  {"lat": 25.7617, "lng": -80.1918, "country": "USA", "city": "Miami"},
  {"lat": 34.0522, "lng": -118.2437, "country": "USA", "city": "Los Angeles"},
  {"lat": 49.2827, "lng": -123.1207, "country": "Canada", "city": "Vancouver"},
  {"lat": 43.6532, "lng": -79.3832, "country": "Canada", "city": "Toronto"},
  {"lat": 19.4326, "lng": -99.1332, "country": "Mexico", "city": "Mexico City"},
  {"lat": -22.9519, "lng": -43.2105, "country": "Brazil", "city": "Rio (Christ the Redeemer)"},
  {"lat": -34.6037, "lng": -58.3816, "country": "Argentina", "city": "Buenos Aires"},
  {"lat": -33.4489, "lng": -70.6693, "country": "Chile", "city": "Santiago"},
  {"lat": -33.8568, "lng": 151.2153, "country": "Australia", "city": "Sydney (Opera House)"},
  {"lat": -37.8136, "lng": 144.9631, "country": "Australia", "city": "Melbourne"},
  {"lat": -36.8485, "lng": 174.7633, "country": "New Zealand", "city": "Auckland"},
  {"lat": 30.0444, "lng": 31.2357, "country": "Egypt", "city": "Cairo"},
  {"lat": -33.9249, "lng": 18.4241, "country": "South Africa", "city": "Cape Town"},
  {"lat": 25.1972, "lng": 55.2744, "country": "UAE", "city": "Dubai (Burj Khalifa)"},
  {"lat": 32.0853, "lng": 34.7818, "country": "Israel", "city": "Tel Aviv"},
  {"lat": 41.0082, "lng": 28.9784, "country": "Turkey", "city": "Istanbul"}
];

export default function GeoGuessrGame() {
  const [gameMode, setGameMode] = useState('menu'); 
  const [currentLocation, setCurrentLocation] = useState(null);
  const [guessLocation, setGuessLocation] = useState(null); 
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastDistance, setLastDistance] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Multiplayer State
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]); // Array of {name, score, id, roundComplete}
  const [isHost, setIsHost] = useState(false);
  const [multiRoomCode, setMultiRoomCode] = useState('');
  const [playerId, setPlayerId] = useState(''); 
  
  // Refs
  const panoramaRef = useRef(null); 
  const guessMapRef = useRef(null); 
  const mapInstanceRef = useRef(null); 
  const guessMarkerRef = useRef(null); 
  const correctMarkerRef = useRef(null); 
  const polylineRef = useRef(null); 

  // Cleanup
  useEffect(() => {
    if (gameMode !== 'single' && gameMode !== 'multi') {
        mapInstanceRef.current = null;
        setGuessLocation(null);
        setShowResult(false);
    }
  }, [gameMode]);

  // --- Helpers ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateScore = (distance) => {
    return Math.round(5000 * Math.exp(-distance / 2000));
  };

  const getRandomOffset = (lat, lng) => {
    const offset = 0.5; 
    const newLat = lat + (Math.random() - 0.5) * offset * 2;
    const newLng = lng + (Math.random() - 0.5) * offset * 2;
    return { lat: newLat, lng: newLng };
  };

  const generateRandomCoords = () => {
    const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const randomOffset = getRandomOffset(randomLocation.lat, randomLocation.lng);
    return {
        lat: randomOffset.lat,
        lng: randomOffset.lng,
        country: randomLocation.country,
        city: randomLocation.city
    };
  };

  // --- Pre-validation Logic ---
  const getValidStreetViewLocation = async () => {
    if (!window.google) return null;
    const sv = new window.google.maps.StreetViewService();
    
    let attempts = 0;
    let foundLocation = null;

    while (!foundLocation && attempts < 5) {
        attempts++;
        const candidate = generateRandomCoords();
        
        try {
            const result = await new Promise((resolve, reject) => {
                sv.getPanorama({ 
                    location: { lat: candidate.lat, lng: candidate.lng }, 
                    radius: 100000, 
                    preference: 'nearest'
                }, (data, status) => {
                    if (status === 'OK') resolve(data);
                    else reject(status);
                });
            });

            foundLocation = {
                lat: result.location.latLng.lat(),
                lng: result.location.latLng.lng(),
                country: candidate.country,
                city: candidate.city
            };
        } catch (error) {
            console.log(`Attempt ${attempts} failed, retrying...`);
        }
    }
    return foundLocation || LOCATIONS[0];
  };

  // --- Map & Street View ---
  const initGuessMap = () => {
    if (window.google && guessMapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(guessMapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        disableDefaultUI: true, 
        clickableIcons: false,
      });

      mapInstanceRef.current.addListener('click', (e) => {
        if (document.body.getAttribute('data-show-result') === 'true') return;
        
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setGuessLocation({ lat, lng });

        if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);
        guessMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }
        });
      });
    }
  };

  const loadStreetView = (location) => {
    if (window.google && panoramaRef.current) {
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
    }
  };

  const startNewRound = (locationData) => {
    setCurrentLocation(locationData);
    setGuessLocation(null);
    setShowResult(false);
    setLastDistance(null);
    setLastScore(null);
    setIsLoading(false);
    
    if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);
    if (correctMarkerRef.current) correctMarkerRef.current.setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);
    
    if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: 0, lng: 0 });
        mapInstanceRef.current.setZoom(2);
    }

    setTimeout(() => {
        loadStreetView(locationData);
        initGuessMap(); 
    }, 200);
  };

  // --- Interactions ---

  useEffect(() => {
    document.body.setAttribute('data-show-result', showResult);
  }, [showResult]);

  const submitGuess = () => {
    if (!guessLocation || !currentLocation) return;
    const distance = calculateDistance(currentLocation.lat, currentLocation.lng, guessLocation.lat, guessLocation.lng);
    const roundScore = calculateScore(distance);
    
    setLastDistance(distance);
    setLastScore(roundScore);
    const newTotalScore = score + roundScore;
    setScore(newTotalScore);
    setShowResult(true);

    if (mapInstanceRef.current) {
        correctMarkerRef.current = new window.google.maps.Marker({
            position: { lat: currentLocation.lat, lng: currentLocation.lng },
            map: mapInstanceRef.current,
            icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }
        });
        const lineCoordinates = [{ lat: guessLocation.lat, lng: guessLocation.lng }, { lat: currentLocation.lat, lng: currentLocation.lng }];
        polylineRef.current = new window.google.maps.Polyline({
            path: lineCoordinates, geodesic: true, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2,
        });
        polylineRef.current.setMap(mapInstanceRef.current);
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: guessLocation.lat, lng: guessLocation.lng });
        bounds.extend({ lat: currentLocation.lat, lng: currentLocation.lng });
        mapInstanceRef.current.fitBounds(bounds);
    }

    // Multiplayer: Update Score AND Round Complete Status
    if (gameMode === 'multi' && multiRoomCode && playerId) {
        update(ref(db, `rooms/${multiRoomCode}/players/${playerId}`), {
            score: newTotalScore,
            roundComplete: true // 標記為已答題
        });
    }
  };

  const handleNextRoundAction = async () => {
    setIsLoading(true);

    if (gameMode === 'single') {
        if (round >= maxRounds) {
            setGameOver(true);
            setIsLoading(false);
        } else {
            setRound(round + 1);
            const nextLocation = await getValidStreetViewLocation();
            startNewRound(nextLocation);
        }
    } else if (gameMode === 'multi' && isHost) {
        // 房主觸發下一回合
        if (round >= maxRounds) {
            update(ref(db, `rooms/${multiRoomCode}`), { status: 'finished' });
            setIsLoading(false);
        } else {
            const nextRoundNum = round + 1;
            const nextLocation = await getValidStreetViewLocation();
            
            // 建立更新物件，一次性更新多個路徑
            const updates = {};
            updates[`rooms/${multiRoomCode}/round`] = nextRoundNum;
            updates[`rooms/${multiRoomCode}/currentLocation`] = nextLocation;
            
            // 重置所有玩家的 roundComplete 為 false
            players.forEach(p => {
                 updates[`rooms/${multiRoomCode}/players/${p.id}/roundComplete`] = false;
            });

            await update(ref(db), updates);
        }
    }
  };

  // --- Multiplayer Logic ---

  const createRoom = async () => {
    if (!playerName.trim()) { alert('Please enter player name!'); return; }
    setIsLoading(true);
    
    const newRoomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newPlayerId = Date.now().toString(); 
    
    const initialLocation = await getValidStreetViewLocation();

    const roomData = {
        host: playerName,
        status: 'lobby',
        round: 1,
        currentLocation: initialLocation,
        players: {
            [newPlayerId]: { name: playerName, score: 0, roundComplete: false }
        }
    };

    try {
        await set(ref(db, 'rooms/' + newRoomCode), roomData);
        setMultiRoomCode(newRoomCode);
        setPlayerId(newPlayerId);
        setIsHost(true);
        setGameMode('lobby');
    } catch (error) {
        console.error("Firebase Error:", error);
        alert("Failed to create room.");
    } finally {
        setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) { alert('Please enter details!'); return; }
    const code = roomCode.toUpperCase();
    const newPlayerId = Date.now().toString();

    const roomRef = ref(db, `rooms/${code}`);
    try {
        const snapshot = await get(roomRef);
        if (snapshot.exists()) {
            await update(ref(db, `rooms/${code}/players`), {
                [newPlayerId]: { name: playerName, score: 0, roundComplete: false }
            });
            
            setMultiRoomCode(code);
            setPlayerId(newPlayerId);
            setIsHost(false);
            setGameMode('lobby');
        } else {
            alert('Room not found!');
        }
    } catch (error) {
        console.error("Join Error:", error);
    }
  };

  const hostStartGame = () => {
    if (!isHost) return;
    update(ref(db, `rooms/${multiRoomCode}`), { status: 'playing' });
  };

  useEffect(() => {
    if (!multiRoomCode) return;

    const roomRef = ref(db, `rooms/${multiRoomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (data.players) {
                const playerList = Object.entries(data.players).map(([key, val]) => ({
                    id: key,
                    ...val
                }));
                setPlayers(playerList);
            }

            if (data.status === 'playing' && gameMode === 'lobby') {
                setGameMode('multi');
                if (data.currentLocation) {
                    startNewRound(data.currentLocation);
                }
            } else if (data.status === 'finished') {
                setGameOver(true);
            }

            if (data.status === 'playing') {
                if (data.round !== round) {
                    setRound(data.round);
                    if (data.currentLocation) {
                        startNewRound(data.currentLocation);
                    }
                }
            }
        }
    });

    return () => unsubscribe();
  }, [multiRoomCode, gameMode, round]);


  useEffect(() => {
    if (!window.google) {
        const script = document.createElement('script');
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
  }, []);

  // --- UI Components ---

  const renderMultiplayerStatus = () => {
    if (gameMode !== 'multi') return null;
    
    // 檢查是否所有人都完成了
    const allFinished = players.every(p => p.roundComplete);

    return (
        <div className="mt-4 border-t pt-2">
            <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Players Status
            </h4>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                {players.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                            {p.roundComplete ? 
                                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                                <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                            }
                            <span className={p.id === playerId ? "font-bold" : ""}>
                                {p.name} {p.id === playerId ? '(You)' : ''}
                            </span>
                        </div>
                        <span className="font-mono font-bold text-blue-600">{p.score} pts</span>
                    </div>
                ))}
            </div>
            
            {/* 房主專屬控制區 */}
            {isHost && (
                <div className="mt-3">
                    {!allFinished ? (
                        <p className="text-xs text-red-500 italic text-center">Waiting for everyone to finish...</p>
                    ) : (
                        <p className="text-xs text-green-600 italic text-center mb-1">All players ready!</p>
                    )}
                    
                    <button 
                        onClick={handleNextRoundAction} 
                        disabled={!allFinished} // 只有當所有人都完成時，按鈕才啟用
                        className={`w-full py-2 rounded-lg font-bold transition ${
                            allFinished 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {round >= maxRounds ? 'View Final Results' : 'Next Round'}
                    </button>
                </div>
            )}
            
            {!isHost && (
                <div className="mt-3 text-center text-gray-500 text-xs italic">
                    {allFinished ? "Waiting for host to start next round..." : "Waiting for other players..."}
                </div>
            )}
        </div>
    );
  };

  // --- Loading Screen ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center text-white">
        <Globe className="w-16 h-16 animate-spin mb-4" />
        <h2 className="text-2xl font-bold">Loading...</h2>
      </div>
    );
  }

  // --- Menu ---
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Globe className="w-20 h-20 mx-auto mb-4 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">GeoGuessr</h1>
            <p className="text-gray-600">Global Multiplayer Edition</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={async () => { 
                  setGameMode('single'); 
                  setIsLoading(true);
                  const startLoc = await getValidStreetViewLocation();
                  startNewRound(startLoc); 
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition"
            >
              <Play className="w-6 h-6" /> Single Player
            </button>
            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" /> Multiplayer (Online)
              </h3>
              <input type="text" placeholder="Your Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full p-3 border rounded-lg mb-3" />
              <div className="space-y-2">
                <button onClick={createRoom} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">Create Online Room</button>
                <div className="flex gap-2">
                  <input type="text" placeholder="Room Code" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} className="flex-1 p-3 border rounded-lg" maxLength={6} />
                  <button onClick={joinRoom} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition">Join</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Lobby ---
  if (gameMode === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Lobby</h2>
            <p className="text-2xl font-mono font-bold text-blue-600">{multiRoomCode}</p>
            <p className="text-sm text-gray-500 mt-2">Share this code with your friends!</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-gray-700 mb-3">Players Joined ({players.length})</h3>
            <div className="space-y-2">
              {players.map((p) => (
                <div key={p.id} className="bg-white p-3 rounded-lg flex justify-between">
                    <span className="font-semibold">{p.name} {p.id === playerId ? '(You)' : ''}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {isHost ? (
                <button onClick={hostStartGame} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">Start Game</button>
            ) : (
                <div className="text-center text-gray-600 italic">Waiting for host to start...</div>
            )}
            <button onClick={() => { setGameMode('menu'); setMultiRoomCode(''); setPlayers([]); }} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition">Leave</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Game Over ---
  if (gameOver) {
    const sortedPlayers = gameMode === 'multi' ? [...players].sort((a, b) => b.score - a.score) : [];
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
            {gameMode === 'single' && <p className="text-5xl font-bold text-blue-600">{score} Points</p>}
          </div>
          {gameMode === 'multi' && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-700 mb-3">Leaderboard</h3>
              <div className="space-y-2">
                {sortedPlayers.map((p, i) => (
                  <div key={p.id} className="bg-white p-3 rounded-lg flex justify-between">
                      <span className="font-semibold">{i+1}. {p.name}</span>
                      <span className="font-bold text-blue-600">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => { setGameMode('menu'); setScore(0); setRound(1); setGameOver(false); }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"><Home className="w-5 h-5" /> Main Menu</button>
        </div>
      </div>
    );
  }

  // --- Main Game Interface ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-md p-4 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div><span className="text-sm text-gray-600">Round</span><p className="text-2xl font-bold text-blue-600">{round}/{maxRounds}</p></div>
            <div><span className="text-sm text-gray-600">Score</span><p className="text-2xl font-bold text-green-600">{score}</p></div>
            {gameMode === 'multi' && <div><span className="text-sm text-gray-600">Room</span><p className="text-lg font-mono font-bold">{multiRoomCode}</p></div>}
          </div>
          <button onClick={() => setGameMode('menu')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Leave</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-full relative">
        {/* Left: Street View */}
        <div className="w-full md:w-[70%] h-[50vh] md:h-auto relative bg-black">
          <div ref={panoramaRef} className="w-full h-full">
            <div className="flex items-center justify-center h-full text-white">
                <p>Loading Street View...</p>
            </div>
          </div>
          
          {/* Result Overlay */}
          {showResult && (
            <div className="absolute bottom-4 right-4 bg-white/95 p-4 rounded-xl shadow-lg backdrop-blur-sm z-30 min-w-[300px]">
               <h3 className="font-bold text-lg mb-1">Round Result</h3>
               <p>Distance: <span className="font-bold text-red-500">{Math.round(lastDistance)} km</span></p>
               <p>Score: <span className="font-bold text-green-600">+{lastScore}</span></p>
               
               {/* 顯示多人對戰狀態 */}
               {gameMode === 'multi' && renderMultiplayerStatus()}

               {/* 單人模式直接顯示按鈕 */}
               {gameMode === 'single' && (
                   <button onClick={handleNextRoundAction} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                     {round >= maxRounds ? 'View Total' : 'Next Round'}
                   </button>
               )}
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="w-full md:w-[30%] h-[40vh] md:h-auto relative border-l-4 border-white z-20 shadow-2xl">
           <div ref={guessMapRef} className="w-full h-full bg-gray-200 cursor-crosshair"></div>
           {!showResult && (
             <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-none">
               <button 
                 onClick={submitGuess}
                 disabled={!guessLocation}
                 className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl pointer-events-auto transition transform hover:scale-105 ${
                    guessLocation ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-800/50 text-gray-300 cursor-not-allowed'
                 }`}
               >
                 {guessLocation ? 'Make Guess' : 'Click Map to Place Guess'}
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}