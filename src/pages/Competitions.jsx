import CompetitionGrid from "@/components/competitions/CompetitionGrid";
import { Trophy } from "lucide-react";

export default function Competitions() {

  return (

    <div className="min-h-screen bg-base text-white">

      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="flex items-center gap-3 mb-8">

          <div className="
            w-14
            h-14
            rounded-2xl
            bg-[#D4AF37]
            flex
            items-center
            justify-center
            shadow-[0_0_30px_rgba(212,175,55,.45)]
          ">

            <Trophy
              size={30}
              className="text-black"
            />

          </div>

          <div>

            <h1 className="text-3xl font-black">
              البطولات
            </h1>

            <p className="text-zinc-400 mt-1">
              اختر البطولة التي تريد متابعتها
            </p>

          </div>

        </div>

        <CompetitionGrid />

      </div>

    </div>

  );

}
