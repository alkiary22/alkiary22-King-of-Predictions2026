import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const TeamsContext = createContext({ teams: [], teamsMap: {} });

export function TeamsProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/teams");
        setTeams(data);
        const m = {};
        data.forEach((t) => (m[t.code] = t));
        setTeamsMap(m);
      } catch (e) {
        // silent
      }
    })();
  }, []);

  return (
    <TeamsContext.Provider value={{ teams, teamsMap }}>
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  return useContext(TeamsContext);
}
