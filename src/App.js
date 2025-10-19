import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const socket = io("https://hideandseek-app.onrender.com"); // Backend-Link

function App() {
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState(null);
  const [countdown, setCountdown] = useState(5 * 60); // 5 Minuten

  // --- Socket.io Verbindung ---
  useEffect(() => {
    socket.on("connect", () => console.log("Connected:", socket.id));
    socket.on("updateTeams", (data) => setTeams(data));
    socket.on("nextUpdate", (timestamp) => {
      const secondsLeft = Math.max(Math.floor((timestamp - Date.now()) / 1000), 0);
      setCountdown(secondsLeft);
    });

    return () => {
      socket.off("connect");
      socket.off("updateTeams");
      socket.off("nextUpdate");
    };
  }, []);

  // --- Countdown jede Sekunde runterzählen ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 5 * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Standort alle 5 Minuten senden ---
  useEffect(() => {
    if (teamId && navigator.geolocation) {
      const sendLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            socket.emit("updateLocation", { teamId, location: { lat: latitude, lng: longitude } });
          },
          (err) => console.error(err),
          { enableHighAccuracy: true }
        );
      };

      sendLocation(); // sofort senden
      const interval = setInterval(sendLocation, 5 * 60 * 1000); // 5 Minuten
      return () => clearInterval(interval);
    }
  }, [teamId]);

  // --- Team registrieren ---
  const registerTeam = async () => {
    if (!teamName) return alert("Bitte Teamnamen eingeben!");
    try {
      const res = await axios.post("https://hideandseek-app.onrender.com/register-team", { name: teamName });
      alert(res.data.message);
      setTeamId(res.data.team._id);
      socket.emit("joinRoom", res.data.team._id);
      setTeamName("");
    } catch (err) {
      console.error(err);
      alert("Fehler bei der Registrierung");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Hide & Seek Teams</h1>

      <div>
        <input type="text" placeholder="Teamname" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
        <button onClick={registerTeam}>Registrieren</button>
      </div>

      <h2>Teams Übersicht</h2>
      <h3>Nächste Standortaktualisierung in: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</h3>

      <ul>
        {teams.map((t) => (
          <li key={t._id}>
            {t.name} – Lat: {t.location.lat} | Lng: {t.location.lng} | Coins: {t.coins}
          </li>
        ))}
      </ul>

      <h2>Karte</h2>
      <MapContainer center={[0, 0]} zoom={2} style={{ height: "400px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {teams.map((t) => (
          <Marker key={t._id} position={[t.location.lat, t.location.lng]} />
        ))}
      </MapContainer>
    </div>
  );
}

export default App;


