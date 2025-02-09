import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ethers } from "ethers";
import { vote } from "@/lib/contract";
import { AlertCircle, Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface VotingInterfaceProps {
  caseId: number;
  innocentVotes: number;
  guiltyVotes: number;
  endTime: number;
  isActive: boolean;
  isFinalized: boolean;
  onVoteSuccess?: () => void;
}

export function VotingInterface({
  caseId,
  innocentVotes,
  guiltyVotes,
  endTime,
  isActive,
  isFinalized,
  onVoteSuccess
}: VotingInterfaceProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const { toast } = useToast();

  const totalVotes = innocentVotes + guiltyVotes;
  const innocentPercentage = totalVotes ? (innocentVotes / totalVotes) * 100 : 0;
  const guiltyPercentage = totalVotes ? (guiltyVotes / totalVotes) * 100 : 0;

  const timeRemaining = endTime * 1000 - Date.now();
  const isVotingPeriodActive = timeRemaining > 0 && isActive && !isFinalized;

  const formatTimeRemaining = () => {
    if (timeRemaining <= 0) return "Voting period ended";
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m remaining`;
  };

  const handleVote = async (isGuilty: boolean) => {
    try {
      setIsVoting(true);
      const amount = ethers.parseEther(stakeAmount);
      await vote(caseId, isGuilty, amount);
      
      toast({
        title: "Vote submitted successfully",
        description: `You voted ${isGuilty ? "Guilty" : "Innocent"} with ${stakeAmount} ETH stake`,
        className: "bg-green-600",
      });
      
      onVoteSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error submitting vote",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  if (!isActive || isFinalized) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Voting Closed</AlertTitle>
        <AlertDescription>
          This case has been {isFinalized ? "finalized" : "deactivated"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Cast Your Vote</span>
          <span className="text-sm font-normal text-muted-foreground">
            {formatTimeRemaining()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voting Statistics */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Innocent ({innocentVotes} votes)</span>
            <span>Guilty ({guiltyVotes} votes)</span>
          </div>
          <div className="flex gap-1 h-2">
            <div 
              className="bg-green-500 rounded-l"
              style={{ width: `${innocentPercentage}%` }}
            />
            <div 
              className="bg-red-500 rounded-r"
              style={{ width: `${guiltyPercentage}%` }}
            />
          </div>
        </div>

        {/* Voting Controls */}
        {isVotingPeriodActive ? (
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="max-w-[150px]"
              />
              <span className="text-sm text-muted-foreground">ETH Stake</span>
            </div>
            
            <div className="flex gap-4">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handleVote(false)}
                disabled={isVoting}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Vote Innocent
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handleVote(true)}
                disabled={isVoting}
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Vote Guilty
              </Button>
            </div>

            {isVoting && (
              <Alert>
                <AlertCircle className="h-4 w-4 animate-spin" />
                <AlertTitle>Processing Vote</AlertTitle>
                <AlertDescription>
                  Please wait while your vote is being processed...
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Voting Period Ended</AlertTitle>
            <AlertDescription>
              The voting period for this case has ended
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
