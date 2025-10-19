
/* ======== FRONTEND: App.jsx ======== */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const socket = io('https://hideandseek-app.onrender.com');
axios.get('https://hideandseek-app.onrender.com/api/challenges');

export default function App() {
const [teams, setTeams] = useState([]);
const [timer, setTimer] = useState('');
const [teamName, setTeamName] = useState('');
const [members, setMembers] = useState('');
const [teamId, setTeamId] = useState(null);
const [challenges, setChallenges] = useState([]);
const [myCoins, setMyCoins] = useState(0);
const [myPowerups, setMyPowerups] = useState(0);

useEffect(() => {
fetchChallenges();
socket.on('locationUpdate', (data) => {
setTeams(data);
if (teamId) {
const myTeam = data.find(t => t._id === teamId);
if (myTeam) {
setMyCoins(myTeam.coins);
setMyPowerups(myTeam.powerups.skipLocation);
}
}
});
socket.on('timer', ({ nextUpdate }) => {
const diff = new Date(nextUpdate) - new Date();
const minutes = Math.floor(diff / 60000);
const seconds = Math.floor((diff % 60000) / 1000);
setTimer(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
});
}, [teamId]);

useEffect(() => {
  if (teamId && navigator.geolocation) {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('updateLocation', {
          teamId,
          location: { lat: latitude, lng: longitude },
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }
}, [teamId]);

const fetchChallenges = async () => {
const res = await axios.get('[http://localhost:5000/api/challenges](http://localhost:5000/api/challenges)');
setChallenges(res.data);
};

const registerTeam = async () => {
const res = await axios.post('[http://localhost:5000/api/teams](http://localhost:5000/api/teams)', {
name: teamName,
members: members.split(',').map(m => m.trim())
});
setTeamId(res.data._id);
};

const completeChallenge = async (challengeId) => {
if (!teamId) return;
const res = await axios.post(`http://localhost:5000/api/teams/${teamId}/complete-challenge`, { challengeId });
setMyCoins(res.data.coins);
alert(`Coins: ${res.data.coins}`);
};

const useSkipPowerup = async () => {
if (!teamId) return;
const res = await axios.post(`http://localhost:5000/api/teams/${teamId}/use-powerup`, { type: 'skip' });
if(res.data.success) {
setMyPowerups(res.data.team.powerups.skipLocation);
alert('Powerup genutzt!');
} else alert('Keine Powerups verfügbar');
};

return ( <div className="p-4"> <h1 className="text-2xl font-bold mb-2">Hide and Seek Live</h1>
{!teamId ? ( <div>
<input placeholder="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} />
<input placeholder="Mitglieder (Komma getrennt)" value={members} onChange={e => setMembers(e.target.value)} /> <button onClick={registerTeam}>Team registrieren</button> </div>
) : ( <div> <p>Team registriert!</p> <p>Coins: {myCoins} | Skip Powerups: {myPowerups}</p> <button onClick={useSkipPowerup}>Skip Standort Powerup</button> <h2 className="mt-2">Challenges</h2>
{challenges.map(ch => ( <div key={ch._id}> <p>{ch.title} - Belohnung: {ch.rewardCoins} Coins</p>
<button onClick={() => completeChallenge(ch._id)}>Abschließen</button> </div>
))} </div>
)}

```
  <p>Nächste Standortfreigabe in: {timer}</p>
  <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '400px', marginTop: '20px' }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {teams.map(team => (
      <Marker key={team._id} position={[team.location?.lat || 51.505, team.location?.lng || -0.09]}>
        <Popup>{team.name} - Coins: {team.coins}</Popup>
      </Marker>
    ))}
  </MapContainer>
</div>

);
}
