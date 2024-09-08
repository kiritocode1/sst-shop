import Carpediem from "@/components/Carpe-diem";
import Link from "next/link";


export default function Home() {
  return (
		<main className="w-full relative ">
			<div className="absolute z-0 w-screen h-[100dvh] ">
        <Carpediem />
        
      </div>
      
      <div className="absolute z-20  p-2 right-0 ">
        by
        <Link href="https://aryank.online" className="italic font-mono p-1 text-xl">
          Aryan kathawale
          </Link>
      </div>
		</main>
  );
}
