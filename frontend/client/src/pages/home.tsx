import { useQuery } from '@tanstack/react-query';
import { fetchCases } from '@/lib/contract';
import CaseCard from '@/components/CaseCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { data: cases, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: fetchCases
  });

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading cases...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Active Cases</CardTitle>
          <CardDescription>
            Browse active court cases and participate in judgements
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cases?.map((case_) => (
          <CaseCard key={case_.id} {...case_} />
        ))}
      </div>
    </div>
  );
}
