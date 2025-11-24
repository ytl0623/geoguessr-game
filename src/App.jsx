import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Trophy, MapPin, Play, Home, Map as MapIcon, CheckCircle, Clock, Loader2 } from 'lucide-react';
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

  // Cleanup map instance on mode change
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
    const offset = 0.01; 
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
    // 確保 DOM 存在且地圖未初始化
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
    setIsLoading(false); // 重要：關閉 Loading
    
    if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);
    if (correctMarkerRef.current) correctMarkerRef.current.setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);
    
    // 確保地圖視角重置
    if (mapInstanceRef.current) {
        window.google.maps.event.trigger(mapInstanceRef.current, 'resize'); // 強制重繪
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

    // Multiplayer: Update Score and Status
    if (gameMode === 'multi' && multiRoomCode && playerId) {
        update(ref(db, `rooms/${multiRoomCode}/players/${playerId}`), {
            score: newTotalScore,
            roundComplete: true
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
        if (round >= maxRounds) {
            update(ref(db, `rooms/${multiRoomCode}`), { status: 'finished' });
            setIsLoading(false);
        } else {
            const nextRoundNum = round + 1;
            const nextLocation = await getValidStreetViewLocation();
            
            const updates = {};
            updates[`rooms/${multiRoomCode}/round`] = nextRoundNum;
            updates[`rooms/${multiRoomCode}/currentLocation`] = nextLocation;
            // Reset all players status
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

  // 頂部玩家狀態列
  const renderTopBarStatus = () => {
    if (gameMode !== 'multi') return null;
    return (
        <div className="hidden md:flex items-center gap-4 border-l pl-4 ml-4">
            {players.map(p => (
                <div key={p.id} className={`flex items-center gap-2 px-3 py-1 rounded-full ${p.id === playerId ? 'bg-blue-100 border border-blue-200' : 'bg-gray-50'}`}>
                    <div className="relative">
                        {p.roundComplete ? 
                            <CheckCircle className="w-4 h-4 text-green-500" /> : 
                            <Clock className="w-4 h-4 text-orange-400 animate-pulse" />
                        }
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{p.name}</span>
                    <span className="text-sm font-bold text-blue-600">{p.score}</span>
                </div>
            ))}
        </div>
    );
  };

  // --- Menu & Lobby ---
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
            {isLoading ? <div className="text-center py-4"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500"/></div> : (
            <>
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
            </>
            )}
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
            {isLoading ? <div className="text-center text-blue-600 font-bold">Starting game...</div> : (
                isHost ? (
                    <button onClick={hostStartGame} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">Start Game</button>
                ) : (
                    <div className="text-center text-gray-600 italic">Waiting for host to start...</div>
                )
            )}
            <button onClick={() => { setGameMode('menu'); setMultiRoomCode(''); setPlayers([]); }} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition">Leave</button>
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
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
            {gameMode === 'single' && <p className="text-5xl font-bold text-blue-600">{score} Points</p>}
          </div>
          {gameMode === 'multi' && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-700 mb-3">Leaderboard</h3>
              <div className="space-y-2">
                {sortedPlayers.map((p, i) => (
                  <div key={p.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-6">#{i+1}</span>
                          <span className="font-semibold">{p.name}</span>
                      </div>
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

  // --- Game Interface ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      
      {/* 全局 Loading Overlay (不拆除下方 DOM) */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <Loader2 className="w-16 h-16 animate-spin mb-4" />
            <h2 className="text-2xl font-bold">Traveling to next location...</h2>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white shadow-md p-4 z-10 flex justify-between items-center">
        <div className="flex items-center gap-6">
            <div><span className="text-xs text-gray-500 uppercase block">Round</span><span className="text-xl font-bold text-blue-600">{round}/{maxRounds}</span></div>
            {gameMode === 'single' && (
               <div><span className="text-xs text-gray-500 uppercase block">Score</span><span className="text-xl font-bold text-green-600">{score}</span></div>
            )}
            {gameMode === 'multi' && (
                <>
                <div className="hidden md:block"><span className="text-xs text-gray-500 uppercase block">Room</span><span className="text-lg font-mono font-bold">{multiRoomCode}</span></div>
                {renderTopBarStatus()}
                </>
            )}
        </div>
        <button onClick={() => setGameMode('menu')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm">Leave</button>
      </div>

      {/* Mobile Player Status (Only visible on small screens) */}
      {gameMode === 'multi' && (
          <div className="md:hidden bg-gray-50 border-b p-2 flex overflow-x-auto gap-2">
              {players.map(p => (
                  <div key={p.id} className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-white rounded border shadow-sm text-xs">
                      {p.roundComplete ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Clock className="w-3 h-3 text-orange-400" />}
                      <span className={p.id === playerId ? "font-bold" : ""}>{p.name}: {p.score}</span>
                  </div>
              ))}
          </div>
      )}

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
            <div className="absolute bottom-4 right-4 bg-white/95 p-6 rounded-xl shadow-2xl backdrop-blur-sm z-30 min-w-[320px] border border-gray-100">
               <h3 className="font-bold text-xl mb-2 text-gray-800">Round Result</h3>
               <div className="flex justify-between items-end mb-4">
                   <div>
                       <p className="text-sm text-gray-500">Distance</p>
                       <p className="text-2xl font-bold text-gray-800">{Math.round(lastDistance)} <span className="text-sm font-normal">km</span></p>
                   </div>
                   <div className="text-right">
                       <p className="text-sm text-gray-500">Points</p>
                       <p className="text-2xl font-bold text-green-600">+{lastScore}</p>
                   </div>
               </div>
               
               {/* 多人模式：顯示等待狀態 */}
               {gameMode === 'multi' && (
                   <div className="border-t pt-3">
                        <div className="text-sm font-semibold text-gray-600 mb-2">Waiting for others...</div>
                        {isHost ? (
                            <button 
                                onClick={handleNextRoundAction} 
                                disabled={!players.every(p => p.roundComplete)}
                                className={`w-full py-3 rounded-lg font-bold text-white transition shadow-lg ${
                                    players.every(p => p.roundComplete)
                                    ? 'bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-0.5' 
                                    : 'bg-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {players.every(p => p.roundComplete) ? (round >= maxRounds ? 'Finish Game' : 'Next Round') : `${players.filter(p => p.roundComplete).length}/${players.length} Ready`}
                            </button>
                        ) : (
                            <div className="text-center py-2 bg-gray-100 rounded text-gray-500 text-sm animate-pulse">
                                {players.every(p => p.roundComplete) ? "Host is starting next round..." : "Waiting for other players..."}
                            </div>
                        )}
                   </div>
               )}

               {/* 單人模式：直接顯示按鈕 */}
               {gameMode === 'single' && (
                   <button onClick={handleNextRoundAction} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg transform hover:-translate-y-0.5">
                     {round >= maxRounds ? 'View Total Score' : 'Next Round'}
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