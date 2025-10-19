import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const socket = io("https://hideandseek-app.onrender.com"); // Backend-Link

function App() {
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");

  // --- Socket.io: Standort-Updates empfangen ---
  useEffect(() => {
    socket.on("connect", () => console.log("Connected:", socket.id));
    socket.on("updateTeams", (data) => setTeams(data));
    return () => {
      socket.off("connect");
      socket.off("updateTeams");
    };
  }, []);

  // --- Team registrieren ---
  const registerTeam = async () => {
    if (!teamName) return alert("Bitte Teamnamen eingeben!");
    try {
      const res = await axios.post("https://hideandseek-app.onrender.com/register-team", { name: teamName });
      alert(res.data.message);
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
        <input
          type="text"
          placeholder="Teamname"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <button onClick={registerTeam}>Registrieren</button>
      </div>

      <h2>Teams Übersicht</h2>
      <ul>
        {teams.map((t) => (
          <li key={t._id}>
            {t.name} – Lat: {t.location.lat} | Lng: {t.location.lng} | Coins: {t.coins}
          </li>
        ))}
      </ul>

      <h2>Karte</h2>
      <MapContainer center={[0, 0]} zoom={2} style={{ height: "400px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {teams.map((t) => (
          <Marker key={t._id} position={[t.location.lat, t.location.lng]} />
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
