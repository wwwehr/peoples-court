import { Box, Flex, Heading } from '@/components/ui/card';
import { GavelIcon } from 'lucide-react';
import WalletConnect from './WalletConnect';

export default function Header() {
  return (
    <Box className="w-full border-b border-border bg-background">
      <Flex className="container mx-auto h-16 items-center justify-between px-4">
        <Flex className="items-center gap-2">
          <GavelIcon className="h-8 w-8 text-primary" />
          <Heading className="text-2xl font-bold text-primary">People's Court</Heading>
        </Flex>
        <WalletConnect />
      </Flex>
    </Box>
  );
}
