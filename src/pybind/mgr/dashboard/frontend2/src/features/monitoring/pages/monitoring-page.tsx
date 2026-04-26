import { Activity, ExternalLink, AlertTriangle, VolumeX } from 'lucide-react';
import { useGrafanaUrl, usePrometheusAlerts, usePrometheusSilences } from '../api/use-monitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function AlertStateBadge({ state }: { state: string }) {
  if (state === 'firing') return <Badge variant="destructive">Firing</Badge>;
  if (state === 'pending') return <Badge variant="secondary">Pending</Badge>;
  return <Badge variant="outline">{state}</Badge>;
}

export function MonitoringPage() {
  const { data: grafanaUrl } = useGrafanaUrl();
  const { data: alertGroups = [], isLoading: alertsLoading } = usePrometheusAlerts();
  const { data: silences = [], isLoading: silencesLoading } = usePrometheusSilences();

  const firingCount = alertGroups.reduce(
    (sum, g) => sum + g.alerts.filter((a) => a.state === 'firing').length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Monitoring</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{firingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Alert Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertGroups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Silences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{silences.length}</div>
          </CardContent>
        </Card>
      </div>

      {grafanaUrl?.instance && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Grafana Dashboard</CardTitle>
              <a href={grafanaUrl.instance} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Open Grafana
                </Button>
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <iframe
              src={grafanaUrl.instance}
              className="w-full h-[600px] border rounded"
              title="Grafana"
              sandbox="allow-same-origin allow-scripts allow-popups"
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">
            <AlertTriangle className="mr-1 h-4 w-4" />
            Alerts ({alertGroups.reduce((sum, g) => sum + g.alerts.length, 0)})
          </TabsTrigger>
          <TabsTrigger value="silences">
            <VolumeX className="mr-1 h-4 w-4" />
            Silences ({silences.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-2 mt-4">
          {alertsLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading alerts...</p>
          ) : alertGroups.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active alerts</p>
          ) : (
            alertGroups.map((group, gi) => (
              <Card key={gi}>
                <CardHeader className="pb-2">
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(group.labels).map(([k, v]) => (
                      <Badge key={k} variant="outline">{k}={v}</Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.alerts.map((alert, ai) => (
                    <div key={ai} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{alert.labels.alertname || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.labels.instance || ''} {alert.labels.job || ''}
                        </p>
                      </div>
                      <AlertStateBadge state={alert.state} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="silences" className="space-y-2 mt-4">
          {silencesLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading silences...</p>
          ) : silences.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active silences</p>
          ) : (
            silences.map((silence) => (
              <div key={silence.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{silence.comment || 'No comment'}</p>
                  <p className="text-xs text-muted-foreground">
                    Created by {silence.createdBy} | Ends {new Date(silence.endsAt).toLocaleString()}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {silence.matchers.map((m, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {m.isRegex ? `${m.name}~=${m.value}` : `${m.name}=${m.value}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge variant={silence.status.state === 'active' ? 'default' : 'secondary'}>
                  {silence.status.state}
                </Badge>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
