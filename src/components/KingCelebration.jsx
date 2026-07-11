import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import confetti from "canvas-confetti";

export default function KingCelebration({ leader }) {

  const [show,setShow]=useState(false);

  useEffect(()=>{

    if(!leader) return;

    setShow(true);

    confetti({
      particleCount:180,
      spread:90,
      startVelocity:45,
      origin:{y:0.35},
      colors:[
        "#FFD700",
        "#FFC107",
        "#FFF176",
        "#ffffff"
      ]
    });

    const timer=setTimeout(()=>{
      setShow(false);
    },4000);

    return ()=>clearTimeout(timer);

  },[leader]);

  if(!leader) return null;

  if(!show) return null;

  return(

<div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-none">

<div className="absolute inset-0 bg-black/55 backdrop-blur-sm"/>

<div
className="absolute w-[420px] h-[420px] rounded-full"
style={{
background:"radial-gradient(circle,#FFD70055,transparent 70%)",
animation:"kingPulse 2s infinite"
}}
/>

{Array.from({length:40}).map((_,i)=>(

<div
key={i}
className="absolute"
style={{
left:`${Math.random()*100}%`,
top:`${Math.random()*100}%`,
fontSize:`${14+Math.random()*20}px`,
animation:`spark ${2+Math.random()}s ease-out forwards`
}}
>

{["✨","⭐","👑","🏆"][i%4]}

</div>

))}

<div
className="relative rounded-[34px] bg-[#090909] border border-yellow-400/40 px-10 py-8 text-center shadow-[0_0_70px_rgba(255,215,0,.45)]"
>

<div

style={{
animation:"kingRotate 5s linear infinite"
}}

className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-[0_0_40px_rgba(255,215,0,.7)]"
>

<Crown
size={48}
color="black"
/>

</div>

<div className="mt-5 text-xs font-black tracking-[0.35em] text-yellow-300">

👑 ملك التوقعات الآن

</div>

<div className="mt-3 text-3xl font-black text-white">

{leader.name}

</div>

<div className="mt-3 text-lg text-zinc-300">

المتصدر بـ

<span className="font-black text-yellow-400">

{" "}{leader.total_points}{" "}

</span>

نقطة

</div>

<div className="mt-6 h-2 rounded-full bg-white/10 overflow-hidden">

<div

style={{
animation:"kingBar 4s linear forwards",
background:"#FFD700",
height:"100%",
width:"100%"
}}

/></div>

</div>

<style>{`

@keyframes kingRotate{

0%{
transform:rotate(0deg) scale(1);
}

50%{
transform:rotate(180deg) scale(1.08);
}

100%{
transform:rotate(360deg) scale(1);
}

}

@keyframes kingPulse{

0%{
transform:scale(.75);
opacity:.35;
}

50%{
transform:scale(1.15);
opacity:1;
}

100%{
transform:scale(.75);
opacity:.35;
}

}

@keyframes kingBar{

0%{
width:100%;
}

100%{
width:0%;
}

}

@keyframes spark{

0%{
opacity:0;
transform:translateY(40px) scale(.2) rotate(0deg);
}

20%{
opacity:1;
}

80%{
opacity:1;
}

100%{
opacity:0;
transform:translateY(-220px) scale(1.5) rotate(540deg);
}

}

`}</style>

</div>

);

}
