import React, { useState, useEffect, useRef } from 'react';
import { Globe, Users, Trophy, MapPin, Play, Home, Map as MapIcon, CheckCircle, Clock, Loader2, Timer } from 'lucide-react';
// Import Firebase
import { db } from './firebase';
import { ref, set, onValue, update, get, push, query, orderByChild, limitToLast } from "firebase/database";

// Default Locations Database
const LOCATIONS = [
  // --- Argentina ---
  {"lat": -34.6037, "lng": -58.3816, "country": "Argentina", "city": "Buenos Aires"},
  
  // --- Australia ---
  {"lat": -27.4698, "lng": 153.0251, "country": "Australia", "city": "Brisbane"},
  {"lat": -37.8136, "lng": 144.9631, "country": "Australia", "city": "Melbourne"},
  {"lat": -31.9505, "lng": 115.8605, "country": "Australia", "city": "Perth"},
  {"lat": -33.8568, "lng": 151.2153, "country": "Australia", "city": "Sydney (Opera House)"},
  
  // --- Austria ---
  {"lat": 48.2082, "lng": 16.3738, "country": "Austria", "city": "Vienna"},
  
  // --- Belgium ---
  {"lat": 50.8503, "lng": 4.3517, "country": "Belgium", "city": "Brussels"},
  
  // --- Brazil ---
  {"lat": -22.9519, "lng": -43.2105, "country": "Brazil", "city": "Rio (Christ the Redeemer)"},
  {"lat": -23.5505, "lng": -46.6333, "country": "Brazil", "city": "Sao Paulo"},
  
  // --- Canada ---
  {"lat": 51.0447, "lng": -114.0719, "country": "Canada", "city": "Calgary"},
  {"lat": 45.5017, "lng": -73.5673, "country": "Canada", "city": "Montreal"},
  {"lat": 45.4215, "lng": -75.6972, "country": "Canada", "city": "Ottawa"},
  {"lat": 43.6532, "lng": -79.3832, "country": "Canada", "city": "Toronto"},
  {"lat": 49.2827, "lng": -123.1207, "country": "Canada", "city": "Vancouver"},
  
  // --- Chile ---
  {"lat": -33.4489, "lng": -70.6693, "country": "Chile", "city": "Santiago"},
  
  // --- China ---
  {"lat": 39.9042, "lng": 116.4074, "country": "China", "city": "Beijing"},
  {"lat": 30.5728, "lng": 104.0668, "country": "China", "city": "Chengdu"},
  {"lat": 23.1291, "lng": 113.2644, "country": "China", "city": "Guangzhou"},
  {"lat": 31.2304, "lng": 121.4737, "country": "China", "city": "Shanghai"},
  {"lat": 22.5431, "lng": 114.0579, "country": "China", "city": "Shenzhen"},
  {"lat": 34.3416, "lng": 108.9398, "country": "China", "city": "Xi'an"},
  
  // --- Colombia ---
  {"lat": 4.7110, "lng": -74.0721, "country": "Colombia", "city": "Bogota"},
  
  // --- Czech Republic ---
  {"lat": 50.0755, "lng": 14.4378, "country": "Czech Republic", "city": "Prague"},
  
  // --- Denmark ---
  {"lat": 55.6761, "lng": 12.5683, "country": "Denmark", "city": "Copenhagen"},
  
  // --- Ecuador ---
  {"lat": -0.1807, "lng": -78.4678, "country": "Ecuador", "city": "Quito"},
  
  // --- Egypt ---
  {"lat": 30.0444, "lng": 31.2357, "country": "Egypt", "city": "Cairo"},
  
  // --- Finland ---
  {"lat": 60.1699, "lng": 24.9384, "country": "Finland", "city": "Helsinki"},
  
  // --- France ---
  {"lat": 48.8584, "lng": 2.2945, "country": "France", "city": "Paris (Eiffel Tower)"},
  
  // --- Germany ---
  {"lat": 52.5200, "lng": 13.4050, "country": "Germany", "city": "Berlin"},
  {"lat": 50.1109, "lng": 8.6821, "country": "Germany", "city": "Frankfurt"},
  {"lat": 48.1351, "lng": 11.5820, "country": "Germany", "city": "Munich"},
  
  // --- Greece ---
  {"lat": 37.9838, "lng": 23.7275, "country": "Greece", "city": "Athens"},
  
  // --- Hong Kong ---
  {"lat": 22.2855, "lng": 114.1577, "country": "Hong Kong", "city": "Central"},
  
  // --- Hungary ---
  {"lat": 47.4979, "lng": 19.0402, "country": "Hungary", "city": "Budapest"},
  
  // --- India ---
  {"lat": 12.9716, "lng": 77.5946, "country": "India", "city": "Bangalore"},
  {"lat": 13.0827, "lng": 80.2707, "country": "India", "city": "Chennai"},
  {"lat": 19.0760, "lng": 72.8777, "country": "India", "city": "Mumbai"},
  {"lat": 28.6139, "lng": 77.2090, "country": "India", "city": "New Delhi"},
  
  // --- Indonesia ---
  {"lat": -8.4095, "lng": 115.1889, "country": "Indonesia", "city": "Bali (Denpasar)"},
  {"lat": -6.2088, "lng": 106.8456, "country": "Indonesia", "city": "Jakarta"},
  
  // --- Ireland ---
  {"lat": 53.3498, "lng": -6.2603, "country": "Ireland", "city": "Dublin"},
  
  // --- Israel ---
  {"lat": 32.0853, "lng": 34.7818, "country": "Israel", "city": "Tel Aviv"},
  
  // --- Italy ---
  {"lat": 41.9028, "lng": 12.4964, "country": "Italy", "city": "Rome (Colosseum)"},
  {"lat": 45.4408, "lng": 12.3155, "country": "Italy", "city": "Venice"},
  
  // --- Japan ---
  {"lat": 33.5904, "lng": 130.4017, "country": "Japan", "city": "Fukuoka"},
  {"lat": 34.3853, "lng": 132.4553, "country": "Japan", "city": "Hiroshima"},
  {"lat": 35.0116, "lng": 135.7681, "country": "Japan", "city": "Kyoto (Kamo River)"},
  {"lat": 35.1815, "lng": 136.9066, "country": "Japan", "city": "Nagoya"},
  {"lat": 26.2124, "lng": 127.6809, "country": "Japan", "city": "Naha (Okinawa)"},
  {"lat": 34.6937, "lng": 135.5023, "country": "Japan", "city": "Osaka (Nakanoshima)"},
  {"lat": 43.0618, "lng": 141.3545, "country": "Japan", "city": "Sapporo"},
  {"lat": 38.2682, "lng": 140.8694, "country": "Japan", "city": "Sendai"},
  {"lat": 35.6586, "lng": 139.7454, "country": "Japan", "city": "Tokyo (Tower)"},
  
  // --- Kenya ---
  {"lat": -1.2921, "lng": 36.8219, "country": "Kenya", "city": "Nairobi"},
  
  // --- Malaysia ---
  {"lat": 3.1390, "lng": 101.6869, "country": "Malaysia", "city": "Kuala Lumpur"},
  
  // --- Mexico ---
  {"lat": 19.4326, "lng": -99.1332, "country": "Mexico", "city": "Mexico City"},
  
  // --- Morocco ---
  {"lat": 33.5731, "lng": -7.5898, "country": "Morocco", "city": "Casablanca"},
  
  // --- Netherlands ---
  {"lat": 52.3676, "lng": 4.9041, "country": "Netherlands", "city": "Amsterdam"},
  
  // --- New Zealand ---
  {"lat": -36.8485, "lng": 174.7633, "country": "New Zealand", "city": "Auckland"},
  {"lat": -43.5321, "lng": 172.6362, "country": "New Zealand", "city": "Christchurch"},
  {"lat": -41.2865, "lng": 174.7762, "country": "New Zealand", "city": "Wellington"},
  
  // --- Nigeria ---
  {"lat": 6.5244, "lng": 3.3792, "country": "Nigeria", "city": "Lagos"},
  
  // --- Norway ---
  {"lat": 59.9139, "lng": 10.7522, "country": "Norway", "city": "Oslo"},
  
  // --- Panama ---
  {"lat": 8.9824, "lng": -79.5199, "country": "Panama", "city": "Panama City"},
  
  // --- Peru ---
  {"lat": -12.0464, "lng": -77.0428, "country": "Peru", "city": "Lima"},
  
  // --- Philippines ---
  {"lat": 14.5995, "lng": 120.9842, "country": "Philippines", "city": "Manila"},
  
  // --- Poland ---
  {"lat": 52.2297, "lng": 21.0122, "country": "Poland", "city": "Warsaw"},
  
  // --- Portugal ---
  {"lat": 38.7223, "lng": -9.1393, "country": "Portugal", "city": "Lisbon"},
  
  // --- Qatar ---
  {"lat": 25.2854, "lng": 51.5310, "country": "Qatar", "city": "Doha"},
  
  // --- Russia ---
  {"lat": 55.7522, "lng": 37.6175, "country": "Russia", "city": "Moscow (Red Square)"},
  
  // --- Saudi Arabia ---
  {"lat": 24.7136, "lng": 46.6753, "country": "Saudi Arabia", "city": "Riyadh"},
  
  // --- Singapore ---
  {"lat": 1.2868, "lng": 103.8545, "country": "Singapore", "city": "Merlion Park"},
  
  // --- South Africa ---
  {"lat": -33.9249, "lng": 18.4241, "country": "South Africa", "city": "Cape Town"},
  {"lat": -26.2041, "lng": 28.0473, "country": "South Africa", "city": "Johannesburg"},
  
  // --- South Korea ---
  {"lat": 35.1796, "lng": 129.0756, "country": "South Korea", "city": "Busan"},
  {"lat": 37.4563, "lng": 126.7052, "country": "South Korea", "city": "Incheon"},
  {"lat": 33.4996, "lng": 126.5312, "country": "South Korea", "city": "Jeju City"},
  {"lat": 37.5665, "lng": 126.9780, "country": "South Korea", "city": "Seoul"},
  
  // --- Spain ---
  {"lat": 41.3851, "lng": 2.1734, "country": "Spain", "city": "Barcelona"},
  {"lat": 40.4168, "lng": -3.7038, "country": "Spain", "city": "Madrid"},
  
  // --- Sweden ---
  {"lat": 59.3293, "lng": 18.0686, "country": "Sweden", "city": "Stockholm"},
  
  // --- Switzerland ---
  {"lat": 46.2044, "lng": 6.1432, "country": "Switzerland", "city": "Geneva"},
  {"lat": 47.3769, "lng": 8.5417, "country": "Switzerland", "city": "Zurich"},
  
  // --- Taiwan ---
  {"lat": 23.4801, "lng": 120.4491, "country": "Taiwan", "city": "Chiayi"},
  {"lat": 24.8138, "lng": 120.9675, "country": "Taiwan", "city": "Hsinchu (Science Park)"},
  {"lat": 23.9930, "lng": 121.6011, "country": "Taiwan", "city": "Hualien"},
  {"lat": 22.6273, "lng": 120.2866, "country": "Taiwan", "city": "Kaohsiung (Pier-2)"},
  {"lat": 25.1276, "lng": 121.7392, "country": "Taiwan", "city": "Keelung (Night Market)"},
  {"lat": 24.1477, "lng": 120.6736, "country": "Taiwan", "city": "Taichung (Station)"},
  {"lat": 22.9997, "lng": 120.2270, "country": "Taiwan", "city": "Tainan (Fort Zeelandia)"},
  {"lat": 25.0339, "lng": 121.5644, "country": "Taiwan", "city": "Taipei (101)"},
  {"lat": 22.7613, "lng": 121.1446, "country": "Taiwan", "city": "Taitung"},
  {"lat": 24.9936, "lng": 121.3010, "country": "Taiwan", "city": "Taoyuan (Airport)"},
  
  // --- Thailand ---
  {"lat": 13.7563, "lng": 100.5018, "country": "Thailand", "city": "Bangkok"},
  
  // --- Turkey ---
  {"lat": 41.0082, "lng": 28.9784, "country": "Turkey", "city": "Istanbul"},
  
  // --- UAE ---
  {"lat": 25.1972, "lng": 55.2744, "country": "UAE", "city": "Dubai (Burj Khalifa)"},
  
  // --- UK ---
  {"lat": 51.5007, "lng": -0.1246, "country": "UK", "city": "London (Big Ben)"},
  
  // --- USA ---
  {"lat": 33.7490, "lng": -84.3880, "country": "USA", "city": "Atlanta"},
  {"lat": 30.2672, "lng": -97.7431, "country": "USA", "city": "Austin"},
  {"lat": 42.3601, "lng": -71.0589, "country": "USA", "city": "Boston"},
  {"lat": 41.8781, "lng": -87.6298, "country": "USA", "city": "Chicago"},
  {"lat": 32.7767, "lng": -96.7970, "country": "USA", "city": "Dallas"},
  {"lat": 39.7392, "lng": -104.9903, "country": "USA", "city": "Denver"},
  {"lat": 21.3069, "lng": -157.8583, "country": "USA", "city": "Honolulu"},
  {"lat": 29.7604, "lng": -95.3698, "country": "USA", "city": "Houston"},
  {"lat": 36.1699, "lng": -115.1398, "country": "USA", "city": "Las Vegas"},
  {"lat": 34.0522, "lng": -118.2437, "country": "USA", "city": "Los Angeles"},
  {"lat": 25.7617, "lng": -80.1918, "country": "USA", "city": "Miami"},
  {"lat": 36.1627, "lng": -86.7816, "country": "USA", "city": "Nashville"},
  {"lat": 40.7580, "lng": -73.9855, "country": "USA", "city": "New York (Times Square)"},
  {"lat": 39.9526, "lng": -75.1652, "country": "USA", "city": "Philadelphia"},
  {"lat": 33.4484, "lng": -112.0740, "country": "USA", "city": "Phoenix"},
  {"lat": 45.5051, "lng": -122.6750, "country": "USA", "city": "Portland"},
  {"lat": 32.7157, "lng": -117.1611, "country": "USA", "city": "San Diego"},
  {"lat": 37.8199, "lng": -122.4783, "country": "USA", "city": "San Francisco (Golden Gate)"},
  {"lat": 47.6062, "lng": -122.3321, "country": "USA", "city": "Seattle"},
  {"lat": 38.9072, "lng": -77.0369, "country": "USA", "city": "Washington D.C."},
  
  // --- Vietnam ---
  {"lat": 21.0285, "lng": 105.8542, "country": "Vietnam", "city": "Hanoi"},
  {"lat": 10.8231, "lng": 106.6297, "country": "Vietnam", "city": "Ho Chi Minh City"}
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
  
  // ⏱️ Timer State
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
  // 🔴 新增：用來管理地圖上的資訊視窗
  const infoWindowsRef = useRef([]);

  // Cleanup
  useEffect(() => {
    if (gameMode !== 'single' && gameMode !== 'multi') {
        mapInstanceRef.current = null;
        setGuessLocation(null);
        setShowResult(false);
    }
  }, [gameMode]);

  // ⏱️ Countdown Logic
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
        } catch (error) { console.log(`Attempt ${attempts} failed.`); }
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
    setTimeLeft(30);
    setIsLoading(false);
    
    // 🔴 清理地圖標記與視窗
    if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);
    if (correctMarkerRef.current) correctMarkerRef.current.setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);
    infoWindowsRef.current.forEach(iw => iw.close()); // 關閉所有視窗
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
  const saveSinglePlayerScore = async () => {
    const nameToSave = playerName.trim() || "Guest Player";
    const leaderboardRef = ref(db, 'leaderboard/single');
    await push(leaderboardRef, {
        name: nameToSave,
        score: score,
        timestamp: Date.now()
    });
  };

  const fetchSingleLeaderboard = async () => {
    const q = query(ref(db, 'leaderboard/single'), orderByChild('score'), limitToLast(10));
    const snapshot = await get(q);
    if (snapshot.exists()) {
        const data = snapshot.val();
        const sortedList = Object.values(data).sort((a, b) => b.score - a.score);
        setSingleLeaderboard(sortedList);
    }
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

    // Draw map lines & InfoWindows
    if (mapInstanceRef.current) {
        // 1. 建立正確答案標記 (綠色)
        correctMarkerRef.current = new window.google.maps.Marker({
            position: { lat: currentLocation.lat, lng: currentLocation.lng },
            map: mapInstanceRef.current,
            icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }
        });

        // 🔴 2. 顯示正確答案的資訊視窗 (城市名稱)
        const answerInfo = new window.google.maps.InfoWindow({
            content: `<div style="color:black; font-weight:bold; padding:4px;">
                        ${currentLocation.city || "Unknown City"}, ${currentLocation.country}
                      </div>`
        });
        answerInfo.open(mapInstanceRef.current, correctMarkerRef.current);
        infoWindowsRef.current.push(answerInfo);

        // 3. 如果有猜測，畫線並顯示 "Your Guess"
        if (!isTimeout && guessLocation) {
            const lineCoordinates = [{ lat: guessLocation.lat, lng: guessLocation.lng }, { lat: currentLocation.lat, lng: currentLocation.lng }];
            polylineRef.current = new window.google.maps.Polyline({
                path: lineCoordinates, geodesic: true, strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2,
            });
            polylineRef.current.setMap(mapInstanceRef.current);

            // 🔴 顯示猜測點的資訊視窗
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
            // Timeout or no guess: Center on correct answer
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
            await saveSinglePlayerScore();
            await fetchSingleLeaderboard();
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
    } catch (error) { console.error("Join Error:", error); }
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
          {gameMode === 'single' && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Globe className="w-4 h-4"/> Global Top 10</h3>
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

          <button onClick={() => { setGameMode('menu'); setScore(0); setRound(1); setGameOver(false); }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"><Home className="w-5 h-5" /> Main Menu</button>
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
            
            {/* ⏱️ Timer UI */}
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
        <button onClick={() => setGameMode('menu')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm">Leave</button>
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