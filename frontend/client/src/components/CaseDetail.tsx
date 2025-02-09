import { useQuery } from "@tanstack/react-query";
import { Case, vote, contributeToPrizePool, getCases } from "@/lib/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ethers } from "ethers";
import {
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  ShieldX,
  Swords,
} from "lucide-react";

const PersonaCard = ({ role, isLoading, data: persona = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto bg-white shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex items-start space-x-4">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto bg-white shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex items-start space-x-4">
          <div className="w-24 h-24 rounded-full overflow-hidden">
            <img
              src={persona?.image_url}
              alt={persona?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{persona?.name}</h2>
            <div className="flex items-center text-gray-600 space-x-2">
              {role === "Plaintiff" ? (
                <Swords size={16} />
              ) : (
                <ShieldX size={16} />
              )}
              <span>{role}</span>
            </div>
            <div className="flex items-center text-gray-600 space-x-2">
              <User size={16} />
              <span>{persona?.age} years old</span>
            </div>
            <div className="flex items-center text-gray-600 space-x-2">
              <MapPin size={16} />
              <span>{persona?.details?.location}</span>
            </div>
            <div className="text-gray-800 font-medium">
              {persona?.occupation}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-gray-700">{persona?.physical_description}</div>
        <div className="text-gray-700">{persona?.personality}</div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <span>{isExpanded ? "Show Less" : "Show More"}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h3 className="font-semibold mb-2">Personal History</h3>
              <p className="text-gray-700">
                {persona?.details?.personalHistory}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Motivations</h3>
              <p className="text-gray-700">{persona?.details?.motivations}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Relationships</h3>
              <p className="text-gray-700">{persona?.details?.relationships}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Quirks</h3>
              <p className="text-gray-700">{persona?.details?.quirks}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function CaseDetail({ caseId }: { caseId: number }) {
  const [contribution, setContribution] = useState("");

  const { data: cases } = useQuery({
    queryKey: ["cases"],
    queryFn: getCases,
  });

  const case_ = cases?.find((c) => c.id === caseId);

  if (!case_) return null;

  const plaintiffPersona = useQuery({
    queryKey: ["plaintiffPersona", caseId],
    enabled: !!case_,
    queryFn: async () => {
      const response = await fetch(case_.plaintiffPersonaUrl);
      const payload = await response.json();
      return payload;
    },
  });

  const defendantPersona = useQuery({
    queryKey: ["defendantPersona", caseId],
    enabled: !!case_,
    queryFn: async () => {
      const response = await fetch(case_.defendantPersonaUrl);
      const payload = await response.json();
      return payload;
    },
  });

  const caseFile = useQuery({
    queryKey: ["caseFile", caseId],
    enabled: !!case_,
    queryFn: async () => {
      const response = await fetch(case_.caseUri);
      const payload = await response.json();
      return payload;
    },
  });

  console.log(`${case_.caseUri} -> ${JSON.stringify(caseFile, null, 4)}`);

  const handleVote = async (isGuilty: boolean) => {
    try {
      await vote(caseId, isGuilty, ethers.parseEther("0.01"));
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleContribute = async () => {
    try {
      await contributeToPrizePool(caseId, ethers.parseEther(contribution));
      setContribution("");
    } catch (error) {
      console.error("Error contributing:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Complaint Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{case_.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700">{caseFile?.data?.content}</div>
            <div className="flex justify-between items-center">
              <div>Prize Pool: {ethers.formatEther(case_.prizePool)} ETH</div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="ETH Amount"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                />
                <Button onClick={handleContribute}>Contribute</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plaintiff Section */}
        <PersonaCard role="Plaintiff" {...plaintiffPersona} />

        {/* Defendant Section */}
        <PersonaCard role="Defendant" {...defendantPersona} />
      </div>

      {/* Voting Section */}
      {case_.isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Cast Your Vote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => handleVote(false)}>Vote Innocent</Button>
              <Button onClick={() => handleVote(true)}>Vote Guilty</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

