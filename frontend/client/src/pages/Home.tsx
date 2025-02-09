import { useState } from "react";
import { Logo } from "@/components/Logo";
import { WalletConnect } from "@/components/WalletConnect";
import { CaseList } from "@/components/CaseList";
import { CaseDetail } from "@/components/CaseDetail";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [selectedCase, setSelectedCase] = useState<number | null>(null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <header className="flex justify-between items-center mb-8">
        <Logo />
        <WalletConnect />
      </header>

      {selectedCase ? (
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setSelectedCase(null)}
          >
            ← Back to Cases
          </Button>
          <CaseDetail caseId={selectedCase} />
        </div>
      ) : (
        <CaseList onSelectCase={setSelectedCase} />
      )}
    </div>
  );
}