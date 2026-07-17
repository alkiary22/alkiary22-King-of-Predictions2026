import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Radio,
  Trophy,
  Clock
} from "lucide-react";

import api from "../../lib/api";
import Flag from "../../components/Flag";
import Countdown from "../Countdown";

function TeamSide({ team }) {
  return (
    <div className="flex flex-col items-center gap-1 w-28">

      <Flag code={team?.code} size="w-10 h-8" />

      <div className="text-center text-white font-bold text-sm">
        {team?.name_ar || team?.name || "-"}
      </div>

    </div>
  );
}

export default function HomeDashboard(){

const [matches,setMatches]=useState([]);
const [teamsMap,setTeamsMap]=useState({});

useEffect(()=>{

Promise.all([
api.get("/teams"),
api.get("/matches")
]).then(([teamsRes,matchesRes])=>{

const tm={};

teamsRes.data.forEach(t=>{
tm[t.code]=t;
});

setTeamsMap(tm);

setMatches(
matchesRes.data.sort(
(a,b)=>
new Date(a.kickoff)-new Date(b.kickoff)
)
);

}).catch(()=>{});

},[]);

const nextMatch=useMemo(()=>{

const now=Date.now();

return matches.find(
m=>new Date(m.kickoff).getTime()>now
);

},[matches]);

const home=nextMatch
?teamsMap[nextMatch.home_team]
:null;

const away=nextMatch
?teamsMap[nextMatch.away_team]
:null;

return(

<section className="max-w-md mx-auto px-4 -mt-4 mb-4 space-y-4">

<div className="rounded-2xl border border-gold/20 bg-black/40 backdrop-blur p-5">

<div className="flex items-center justify-around mb-4">

<h2 className="text-white font-black text-sm">
⚽ المباراة القادمة
</h2>

{nextMatch && (
nextMatch.status==="finished" ? (

<div className="px-3 py-1 rounded-full bg-green-600 text-white text-sm font-black">
✅ انتهت
</div>

) : nextMatch.status==="live" ? (

<div className="px-3 py-1 rounded-full bg-red-600 animate-pulse text-white text-sm font-black">
🔴 مباشر
</div>

) : (

<Countdown kickoff={nextMatch.kickoff}/>

)
)}

</div>

{nextMatch ? (

<>

<div className="flex items-center justify-around">

<TeamSide team={home}/>

<div className="flex flex-col items-center gap-1">

<div className="text-center">

{nextMatch?.status==="finished" || nextMatch?.status==="live" ? (

<div className="text-3xl font-black text-gold">
{nextMatch.home_score} - {nextMatch.away_score}
</div>

) : (

<div className="text-lg font-black text-gold">
VS
</div>

)}

</div>

<div className="text-xs text-zinc-400 text-center">

{nextMatch.competition_name ||
 (nextMatch.competition==="worldcup" ? "🏆 كأس العالم 2026" : nextMatch.competition) ||
 nextMatch.league_name ||
 "🏆 كأس العالم 2026"}

</div>

<div className="text-[11px] text-zinc-500">
{
new Date(nextMatch.kickoff).toLocaleString(
"ar-EG",
{
weekday:"long",
day:"numeric",
month:"long",
hour:"2-digit",
minute:"2-digit"
}
)
}
</div>

</div>

<TeamSide team={away}/>

</div>


<Link
to={`/matches#match-${nextMatch.id}`}
className="mt-2 w-full flex justify-center rounded-xl bg-gold text-black font-black py-2"
>

توقع الآن

</Link>

</>

) : (

<div className="text-center text-zinc-400 py-8">

لا توجد مباريات قادمة

</div>

)}

</div>

<div className="grid grid-cols-2 gap-3">

<Link
to="/matches"
className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl border border-gold/30 bg-black/30 text-white font-bold"
>

<CalendarDays className="w-5 h-5 text-gold"/>

المباريات

</Link>

<Link
to="/user-predictions"
className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl border border-gold/30 bg-black/30 text-white font-bold"
>

<Radio className="w-5 h-5 text-gold"/>

التوقعات

</Link>


</div>


<Link
to="/leaderboard"
className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold text-black py-2 font-black"
>

<Trophy className="w-5 h-5"/>

لوحة المتصدرين

</Link>

</section>

);

}

