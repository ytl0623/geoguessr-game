import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Trophy, MapPin, Play, Home, Map as MapIcon } from 'lucide-react';

// Default Locations Database (Translated to English)
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
  const [maxRounds] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastDistance, setLastDistance] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  
  // Multiplayer State
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

  // Calculate Distance (Haversine Formula) - Unit: km
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

  // Calculate Score
  const calculateScore = (distance) => {
    return Math.round(5000 * Math.exp(-distance / 2000));
  };

  // Initialize Guess Map
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
    const offset = 1; // 1 degree is approx 111 km
    const newLat = lat + (Math.random() - 0.5) * offset * 2;
    const newLng = lng + (Math.random() - 0.5) * offset * 2;
    return { lat: newLat, lng: newLng };
  };

  // Start New Round
  const startNewRound = () => {
    const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    
    // Corrected variable name: randomLocation
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

  // Load Street View with Radius Search
  const loadStreetView = (location) => {
    if (window.google && panoramaRef.current) {
      const sv = new window.google.maps.StreetViewService();
      
      // Radius search 50km to ensure a panorama is found
      sv.getPanorama({ location: { lat: location.lat, lng: location.lng }, radius: 50000 }, (data, status) => {
        if (status === 'OK') {
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
            
            // Update current location to the ACTUAL street view location found
            setCurrentLocation(prev => ({
                ...prev,
                lat: data.location.latLng.lat(),
                lng: data.location.latLng.lng()
            }));

        } else {
            console.error("No Street View found nearby:", status);
            panoramaRef.current.innerHTML = '<div style="color:white; display:flex; justify-content:center; align-items:center; height:100%;">No Street View available here...<br/>(Try refreshing or next round)</div>';
        }
      });
    }
  };

  // Submit Guess
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

  // Room Functions
  const createRoom = () => {
    if (!playerName.trim()) { alert('Please enter player name!'); return; }
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
    if (!playerName.trim() || !roomCode.trim()) { alert('Please enter details!'); return; }
    try {
      const storedData = localStorage.getItem(`room:${roomCode.toUpperCase()}`);
      if (!storedData) { alert('Room does not exist!'); return; }
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
            <p className="text-gray-600">Explore the world, guess the location!</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => { setGameMode('single'); startNewRound(); }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition"
            >
              <Play className="w-6 h-6" /> Single Player
            </button>
            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" /> Multiplayer (Local)
              </h3>
              <input type="text" placeholder="Enter Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full p-3 border rounded-lg mb-3" />
              <div className="space-y-2">
                <button onClick={createRoom} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">Create Room</button>
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

  if (gameMode === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Lobby</h2>
            <p className="text-2xl font-mono font-bold text-blue-600">{multiRoomCode}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-gray-700 mb-3">Players ({players.length})</h3>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div key={i} className="bg-white p-3 rounded-lg flex justify-between"><span className="font-semibold">{p.name}</span></div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {isHost && <button onClick={() => { setGameMode('multi'); startNewRound(); }} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">Start Game</button>}
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
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over</h2>
            {gameMode === 'single' && <p className="text-5xl font-bold text-blue-600">{score} Points</p>}
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
          <button onClick={() => { setGameMode('menu'); setScore(0); setRound(1); setGameOver(false); }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"><Home className="w-5 h-5" /> Main Menu</button>
        </div>
      </div>
    );
  }

  // Game Screen
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white shadow-md p-4 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div><span className="text-sm text-gray-600">Round</span><p className="text-2xl font-bold text-blue-600">{round}/{maxRounds}</p></div>
            <div><span className="text-sm text-gray-600">Score</span><p className="text-2xl font-bold text-green-600">{score}</p></div>
          </div>
          <button onClick={() => setGameMode('menu')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Leave</button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col md:flex-row h-full relative">
        
        {/* Left/Top: Street View (70%) */}
        <div className="w-full md:w-[70%] h-[50vh] md:h-auto relative bg-black">
          <div ref={panoramaRef} className="w-full h-full">
            <div className="flex items-center justify-center h-full text-white">
                <p>Loading Street View...</p>
            </div>
          </div>
          
          {/* Result Overlay (Moved to Bottom Right) */}
          {showResult && (
            <div className="absolute bottom-4 right-4 bg-white/90 p-4 rounded-xl shadow-lg backdrop-blur-sm z-10">
               <h3 className="font-bold text-lg mb-1">Round Result</h3>
               <p>Distance: <span className="font-bold text-red-500">{Math.round(lastDistance)} km</span></p>
               <p>Score: <span className="font-bold text-green-600">+{lastScore}</span></p>
               <button onClick={nextRound} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                 {round >= maxRounds ? 'View Total' : 'Next Round'}
               </button>
            </div>
          )}
        </div>

        {/* Right/Bottom: Guess Map (30%) */}
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
                 {guessLocation ? 'Make Guess' : 'Click Map to Place Guess'}
               </button>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}