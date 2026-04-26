import { ExternalLink, BarChart3 } from 'lucide-react';
import { useGrafanaUrl } from '../../api/use-prometheus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function GrafanaDashboardPage() {
  const { data: grafanaUrl, isLoading, error } = useGrafanaUrl();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Grafana 仪表盘</h1>
        </div>
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error || !grafanaUrl?.instance) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Grafana 仪表盘</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Grafana 未配置</p>
                <p className="text-sm text-muted-foreground mt-1">
                  请在配置中设置 Grafana API URL 后刷新页面
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Grafana 仪表盘</h1>
        </div>
        <a href={grafanaUrl.instance} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-1" />
            在新窗口打开
          </Button>
        </a>
      </div>

      <Card>
        <CardContent className="p-0">
          <iframe
            src={grafanaUrl.instance}
            className="w-full h-[calc(100vh-200px)] min-h-[600px] border-0 rounded-lg"
            title="Grafana Dashboard"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </CardContent>
      </Card>
    </div>
  );
}
