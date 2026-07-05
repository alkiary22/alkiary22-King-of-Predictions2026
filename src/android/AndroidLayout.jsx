import AndroidHeader from "./AndroidHeader";
import AndroidBottomNav from "./AndroidBottomNav";

export default function AndroidLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">

      <AndroidHeader />

      <main className="pb-28">
        {children}
      </main>

      <AndroidBottomNav />

    </div>
  );
}
