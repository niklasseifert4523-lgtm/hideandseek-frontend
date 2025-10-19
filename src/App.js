import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const BACKEND_URL = "https://hideandseek-app.onrender.com"; // später ersetzen!

const socket = io(BACKEND_URL);

function App() {
  const [teams, setTeams] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Verbunden mit Server:", socket.id);
    });

    socket.on("updateTeams", (data) => {
      setTeams(data);
    });

    return () => {
      socket.off("connect");
      socket.off("updateTeams");
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Hide & Seek</h1>
      <p>Live Teams:</p>
      <ul>
        {teams.map((t, i) => (
          <li key={i}>{t.name} — {t.location}</li>
        ))}
      </ul>
      <p>{message}</p>
    </div>
  );
}

export default App;
