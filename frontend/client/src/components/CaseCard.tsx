import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ethers } from 'ethers';
import { Link } from 'wouter';

interface CaseCardProps {
  id: number;
  title: string;
  plaintiff: string;
  defendant: string;
  prizePool: string;
  endTime: number;
}

export default function CaseCard({ id, title, plaintiff, defendant, prizePool, endTime }: CaseCardProps) {
  const timeRemaining = new Date(endTime * 1000).toLocaleDateString();
  
  return (
    <Link href={`/case/${id}`}>
      <Card className="cursor-pointer hover:bg-accent">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plaintiff</span>
              <span className="text-sm">{plaintiff.slice(0, 6)}...{plaintiff.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Defendant</span>
              <span className="text-sm">{defendant.slice(0, 6)}...{defendant.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Prize Pool</span>
              <span className="text-sm">{ethers.formatEther(prizePool)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ends</span>
              <span className="text-sm">{timeRemaining}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
