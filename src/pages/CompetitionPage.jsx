import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";

import CompetitionHeader from "@/components/competitions/CompetitionHeader";
import CompetitionTabs from "@/components/competitions/CompetitionTabs";
import CompetitionMatches from "@/components/competitions/CompetitionMatches";
import CompetitionStandings from "@/components/competitions/CompetitionStandings";
import CompetitionTeams from "@/components/competitions/CompetitionTeams";
import CompetitionScorers from "@/components/competitions/CompetitionScorers";

export default function CompetitionPage() {

  const { id } = useParams();

  const [competition,setCompetition]=useState(null);
  const [tab,setTab]=useState("matches");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{

    let active=true;

    async function load(){

      try{

        const {data}=await api.get("/competitions");

        const item=data.find(
          c=>String(c.id)===String(id)
        );

        if(active){
          setCompetition(item||null);
        }

      }catch(e){

        console.error(e);

      }finally{

        if(active) setLoading(false);

      }

    }

    load();

    return()=>active=false;

  },[id]);

  if(loading){

    return(
      <div className="min-h-screen flex items-center justify-center text-white bg-base">
        جاري التحميل...
      </div>
    );

  }

  if(!competition){

    return(
      <div className="min-h-screen flex items-center justify-center text-white bg-base">
        البطولة غير موجودة
      </div>
    );

  }

  return(

    <div className="min-h-screen bg-base text-white">

      <CompetitionHeader
        competition={competition}
      />

      <div className="px-4 py-5">

        <CompetitionTabs
          active={tab}
          onChange={setTab}
        />

      </div>

      <div className="px-4 pb-10">

        {tab==="matches" && (

          <CompetitionMatches
            competition={competition}
          />

        )}

        {tab==="standings" && (

          <CompetitionStandings
            competition={competition}
          />

        )}

        {tab==="teams" && (

          <CompetitionTeams
            competition={competition}
          />

        )}

        {tab==="scorers" && (

          <CompetitionScorers
            competition={competition}
          />

        )}

      </div>

    </div>

  );

}
