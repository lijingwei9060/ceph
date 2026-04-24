import { useTranslation } from 'react-i18next';
import { Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useMonitors } from '../api/use-monitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export function MonitorListPage() {
  const { t } = useTranslation();
  const { data: monitorStatus, isLoading, refetch } = useMonitors();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  const mons = monitorStatus?.monmap?.mons ?? [];
  const quorum = monitorStatus?.quorum ?? [];
  const inQuorumCount = quorum.length;
  const outQuorumCount = mons.length - inQuorumCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">{t('nav.monitors')}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quorum Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>In Quorum: {inQuorumCount}</span>
            </div>
            {outQuorumCount > 0 && (
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Out of Quorum: {outQuorumCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Monitors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Quorum Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mons.map((mon) => {
                const isInQuorum = quorum.includes(mon.rank);
                return (
                  <TableRow key={mon.name}>
                    <TableCell>{mon.rank}</TableCell>
                    <TableCell className="font-medium">{mon.name}</TableCell>
                    <TableCell className="text-muted-foreground">{mon.addr}</TableCell>
                    <TableCell>
                      {isInQuorum ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          In Quorum
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" />
                          Out of Quorum
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
