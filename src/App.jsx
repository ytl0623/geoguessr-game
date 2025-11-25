import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Trophy, MapPin, Play, Home, Map as MapIcon, CheckCircle, Clock, Loader2, Timer, ListOrdered } from 'lucide-react';
// Import Firebase
import { db } from './firebase';
import { ref, set, onValue, update, get, push, query, orderByChild, limitToLast } from "firebase/database";
// Import JSON data
import locationsData from './locations.json';

const LOCATIONS = locationsData;

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
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(30);

  // Leaderboard State
  const [singleLeaderboard, setSingleLeaderboard] = useState([]);

  // Multiplayer State
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]); 
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
  const infoWindowsRef = useRef([]);
  const hasSavedScore = useRef(false);

  // --- Reset Game State ---
  const resetGame = () => {
    setScore(0);
    setRound(1);
    setGameOver(false);
    setShowResult(false);
    setLastDistance(null);
    setLastScore(null);
    setTimeLeft(30);
    setGuessLocation(null);
    setIsLoading(false);
    hasSavedScore.current = false; 
    
    setMultiRoomCode('');
    setPlayers([]);
    setIsHost(false);
  };

  // Cleanup map instance
  useEffect(() => {
    if (gameMode !== 'single' && gameMode !== 'multi') {
        mapInstanceRef.current = null;
        setGuessLocation(null);
        setShowResult(false);
    }
  }, [gameMode]);

  // Timer Logic
  useEffect(() => {
    if ((gameMode === 'single' || gameMode === 'multi') && !showResult && !isLoading && timeLeft > 0) {
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    } else if (timeLeft === 0 && !showResult && !isLoading) {
        submitGuess(true); 
    }
  }, [timeLeft, showResult, isLoading, gameMode]);


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

  // --- 🔴 關鍵修正：Pre-validation Logic 加入 source 限制 ---
  const getValidStreetViewLocation = async () => {
    if (!window.google) return null;
    const sv = new window.google.maps.StreetViewService();
    let attempts = 0;
    let foundLocation = null;
    
    // 嘗試 10 次 (稍微增加次數，因為過濾掉使用者上傳後，可能需要多找幾次)
    while (!foundLocation && attempts < 10) {
        attempts++;
        const candidate = generateRandomCoords();
        try {
            const result = await new Promise((resolve, reject) => {
                sv.getPanorama({ 
                    location: { lat: candidate.lat, lng: candidate.lng }, 
                    radius: 100000, 
                    preference: 'nearest',
                    // 🔴 強制只抓取官方戶外街景 (解決黑畫面/版權問題)
                    source: window.google.maps.StreetViewSource.OUTDOOR 
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
        } catch (error) { console.log(`Attempt ${attempts} failed.`); }
    }
    return foundLocation || LOCATIONS[0]; // 如果真的找不到，回傳台北101
  };

  // --- Map & Street View ---
  const initGuessMap = () => {
    if (window.google && guessMapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(guessMapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        disableDefaultUI: true, 
        keyboardShortcuts: false,
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
    setTimeLeft(30);
    setIsLoading(false);
    
    if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);
    if (correctMarkerRef.current) correctMarkerRef.current.setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);
    infoWindowsRef.current.forEach(iw => iw.close());
    infoWindowsRef.current = [];

    if (mapInstanceRef.current) {
        window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
        mapInstanceRef.current.setCenter({ lat: 0, lng: 0 });
        mapInstanceRef.current.setZoom(2);
    }
    setTimeout(() => {
        loadStreetView(locationData);
        initGuessMap(); 
    }, 200);
  };

  // --- Leaderboard Functions ---
  const saveToLeaderboard = async (finalScore) => {
    try {
      const nameToSave = playerName.trim() || "Guest Player";
      const leaderboardRef = ref(db, 'leaderboard/single');
      await push(leaderboardRef, {
          name: nameToSave,
          score: finalScore,
          timestamp: Date.now()
      });
    } catch (e) {
      console.error("Save Score Error:", e);
    }
  };

  const fetchSingleLeaderboard = async () => {
    try {
      const q = query(ref(db, 'leaderboard/single'), orderByChild('score'), limitToLast(20));
      const snapshot = await get(q);
      if (snapshot.exists()) {
          const data = snapshot.val();
          const sortedList = Object.values(data).sort((a, b) => b.score - a.score);
          setSingleLeaderboard(sortedList);
      } else {
          setSingleLeaderboard([]);
      }
    } catch (e) {
      console.error("Fetch Leaderboard Error:", e);
      setSingleLeaderboard([]);
    }
  };

  const handleOpenLeaderboard = async () => {
      setIsLoading(true);
      await fetchSingleLeaderboard();
      setGameMode('leaderboard');
      setIsLoading(false);
  };

  // --- Interactions ---

  useEffect(() => {
    document.body.setAttribute('data-show-result', showResult);
  }, [showResult]);

  // ⏱️ Submit Guess
  const submitGuess = (isTimeout = false) => {
    if (!isTimeout && (!guessLocation || !currentLocation)) return;

    let distance = 0;
    let roundScore = 0;

    if (isTimeout || !guessLocation) {
        distance = 20000; 
        roundScore = 0;
    } else {
        distance = calculateDistance(currentLocation.lat, currentLocation.lng, guessLocation.lat, guessLocation.lng);
        roundScore = calculateScore(distance);
    }
    
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

        const answerInfo = new window.google.maps.InfoWindow({
            content: `<div style="color:black; font-weight:bold; padding:4px;">
                        ${currentLocation.city || "Unknown City"}, ${currentLocation.country}
                      </div>`
        });
        answerInfo.open(mapInstanceRef.current, correctMarkerRef.current);
        infoWindowsRef.current.push(answerInfo);

        if (!isTimeout && guessLocation) {
            const lineCoordinates = [{ lat: guessLocation.lat, lng: guessLocation.lng }, { lat: currentLocation.lat, lng: currentLocation.lng }];
            polylineRef.current = new window.google.maps.Polyline({
                path: lineCoordinates, geodesic: true, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2,
            });
            polylineRef.current.setMap(mapInstanceRef.current);

            const guessInfo = new window.google.maps.InfoWindow({
                content: `<div style="color:black; padding:4px;">Your Guess</div>`
            });
            guessInfo.open(mapInstanceRef.current, guessMarkerRef.current);
            infoWindowsRef.current.push(guessInfo);

            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend({ lat: guessLocation.lat, lng: guessLocation.lng });
            bounds.extend({ lat: currentLocation.lat, lng: currentLocation.lng });
            mapInstanceRef.current.fitBounds(bounds);
        } else {
            mapInstanceRef.current.setCenter({ lat: currentLocation.lat, lng: currentLocation.lng });
            mapInstanceRef.current.setZoom(4);
        }
    }

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
            try {
                await saveToLeaderboard(score);
                await fetchSingleLeaderboard();
            } catch (error) { console.error(error); } 
            finally {
                setGameOver(true);
                setIsLoading(false);
            }
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
    resetGame();
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
    resetGame();
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
    } catch (error) { console.error("Join Error:", error); }
  };

  const hostStartGame = () => {
    if (!isHost) return;
    update(ref(db, `rooms/${multiRoomCode}`), { status: 'playing' });
  };

  useEffect(() => {
    if (!multiRoomCode) return;
    const roomRef = ref(db, `rooms/${multiRoomCode}`);
    const unsubscribe = onValue(roomRef, async (snapshot) => {
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
                if (!hasSavedScore.current && playerId && data.players[playerId]) {
                    const myFinalScore = data.players[playerId].score;
                    await saveToLeaderboard(myFinalScore);
                    hasSavedScore.current = true; 
                }
                // 多人結束也要抓排行榜
                await fetchSingleLeaderboard();
                setGameOver(true);
                setIsLoading(false);
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
  }, [multiRoomCode, gameMode, round, playerId]);

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

  const renderTopBarStatus = () => {
    if (gameMode !== 'multi') return null;
    return (
        <div className="hidden md:flex items-center gap-4 border-l pl-4 ml-4">
            {players.map(p => (
                <div key={p.id} className={`flex items-center gap-2 px-3 py-1 rounded-full ${p.id === playerId ? 'bg-blue-100 border border-blue-200' : 'bg-gray-50'}`}>
                    <div className="relative">
                        {p.roundComplete ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-orange-400 animate-pulse" />}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{p.name}</span>
                    <span className="text-sm font-bold text-blue-600">{p.score}</span>
                </div>
            ))}
        </div>
    );
  };

  // --- Menu ---
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        
        <style>{`
            .gm-style-cc, .gmnoprint a, .gmnoprint span, .gm-style-mtc {
                display: none !important;
            }
        `}</style>

        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Globe className="w-20 h-20 mx-auto mb-4 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">GeoGuessr</h1>
            <p className="text-gray-600">Global Multiplayer Edition</p>
          </div>
          
          <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 mb-1">Enter Your Name</label>
             <input 
                type="text" 
                placeholder="Your Name (for Leaderboard)" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)} 
                className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" 
             />
          </div>

          <div className="space-y-4">
            {isLoading ? <div className="text-center py-4"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500"/></div> : (
            <>
            <button
              onClick={async () => { 
                  if (!playerName.trim()) { alert('Please enter a name to play!'); return; }
                  resetGame();
                  setGameMode('single'); 
                  setIsLoading(true);
                  const startLoc = await getValidStreetViewLocation();
                  startNewRound(startLoc); 
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition shadow-lg hover:-translate-y-0.5"
            >
              <Play className="w-6 h-6" /> Single Player
            </button>

            <button
              onClick={handleOpenLeaderboard}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition shadow-lg hover:-translate-y-0.5"
            >
              <Trophy className="w-6 h-6" /> Leaderboard
            </button>

            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" /> Multiplayer (Online)
              </h3>
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

  if (gameMode === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-800">Global Top 20</h2>
            <p className="text-gray-500 text-sm">Best Single Player Scores</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 h-96 overflow-y-auto border border-gray-200">
            {singleLeaderboard.length > 0 ? (
              <div className="space-y-2">
                {singleLeaderboard.map((entry, i) => (
                  <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm 
                        ${i === 0 ? 'bg-yellow-100 text-yellow-600' : 
                          i === 1 ? 'bg-gray-200 text-gray-600' : 
                          i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                        {i + 1}
                      </div>
                      <span className="font-semibold text-gray-800">{entry.name}</span>
                    </div>
                    <span className="font-mono font-bold text-blue-600">{entry.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ListOrdered className="w-12 h-12 mb-2 opacity-50" />
                <p>No records yet.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setGameMode('menu')} 
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Home className="w-5 h-5" /> Back to Menu
          </button>
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
            {isLoading ? <div className="text-center text-blue-600 font-bold">Starting game...</div> : (
                isHost ? (
                    <button onClick={hostStartGame} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">Start Game</button>
                ) : (
                    <div className="text-center text-gray-600 italic">Waiting for host to start...</div>
                )
            )}
            <button onClick={() => { 
                resetGame();
                setGameMode('menu'); 
            }} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition">Leave</button>
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
          
          {/* Multi Player Leaderboard */}
          {gameMode === 'multi' && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-700 mb-3">Match Results</h3>
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

          {/* Single Player Global Leaderboard */}
          {(gameMode === 'single' || gameMode === 'multi') && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Globe className="w-4 h-4"/> Global Top 20</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {singleLeaderboard.length > 0 ? singleLeaderboard.map((entry, i) => (
                  <div key={i} className={`bg-white p-2 rounded flex justify-between items-center ${entry.name === playerName && entry.score === score ? 'border-2 border-yellow-400' : ''}`}>
                      <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-5 text-sm">#{i+1}</span>
                          <span className="font-semibold text-sm">{entry.name}</span>
                      </div>
                      <span className="font-bold text-blue-600 text-sm">{entry.score}</span>
                  </div>
                )) : (
                    <div className="text-center text-gray-500 text-sm">Loading leaderboard...</div>
                )}
              </div>
            </div>
          )}

          <button onClick={() => { 
              resetGame();
              setGameMode('menu'); 
          }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"><Home className="w-5 h-5" /> Main Menu</button>
        </div>
      </div>
    );
  }

  // --- Game Interface ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <Loader2 className="w-16 h-16 animate-spin mb-4" />
            <h2 className="text-2xl font-bold">Traveling to next location...</h2>
        </div>
      )}

      <div className="bg-white shadow-md p-4 z-10 flex justify-between items-center">
        <div className="flex items-center gap-6">
            <div><span className="text-xs text-gray-500 uppercase block">Round</span><span className="text-xl font-bold text-blue-600">{round}/{maxRounds}</span></div>
            
            <div className={`flex items-center gap-1 ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                <Timer className="w-5 h-5" />
                <span className="text-2xl font-mono font-bold">{timeLeft}s</span>
            </div>

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
        <button onClick={() => {
            resetGame();
            setGameMode('menu');
        }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm">Leave</button>
      </div>

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
        <div className="w-full md:w-[70%] h-[50vh] md:h-auto relative bg-black">
          <div ref={panoramaRef} className="w-full h-full">
            <div className="flex items-center justify-center h-full text-white">
                <p>Loading Street View...</p>
            </div>
          </div>
          
          {showResult && (
            <div className="absolute bottom-4 right-4 bg-white/95 p-6 rounded-xl shadow-2xl backdrop-blur-sm z-30 min-w-[320px] border border-gray-100">
               <h3 className="font-bold text-xl mb-2 text-gray-800">Round Result</h3>
               {lastDistance === 20000 ? (
                   <div className="mb-4 text-red-600 font-bold">Time's Up! No points awarded.</div>
               ) : (
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
               )}
               
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

               {gameMode === 'single' && (
                   <button onClick={handleNextRoundAction} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg transform hover:-translate-y-0.5">
                     {round >= maxRounds ? 'View Total Score' : 'Next Round'}
                   </button>
               )}
            </div>
          )}
        </div>

        <div className="w-full md:w-[30%] h-[40vh] md:h-auto relative border-l-4 border-white z-20 shadow-2xl">
           <div ref={guessMapRef} className="w-full h-full bg-gray-200 cursor-crosshair"></div>
           {!showResult && (
             <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-none">
               <button 
                 onClick={() => submitGuess(false)}
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