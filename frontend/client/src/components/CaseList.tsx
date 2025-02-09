import { useQuery } from "@tanstack/react-query";
import { getCases } from "@/lib/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ethers } from "ethers";
import logo from "../assets/logo.png";

export function CaseList({
  onSelectCase,
}: {
  onSelectCase: (caseId: number) => void;
}) {
  const { data: cases, isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: getCases,
  });

  if (isLoading) {
    return <div>Loading cases...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <img src={logo} alt="logo" />
      {cases?.map((case_) => (
        <Card
          key={case_.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelectCase(case_.id)}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{case_.title}</span>
              <Badge variant={case_.isActive ? "default" : "secondary"}>
                {case_.isActive ? "Active" : "Closed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Prize Pool: {ethers.formatEther(case_.prizePool)} ETH
              </div>
              <div className="text-sm">
                Votes: {case_.innocentVotes} Innocent / {case_.guiltyVotes}{" "}
                Guilty
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
