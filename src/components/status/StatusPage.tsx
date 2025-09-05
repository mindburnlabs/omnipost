
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  Database,
  Zap,
  Globe,
  RefreshCw,
  Circle
} from "lucide-react";

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  description: string;
  last_updated: string;
  response_time?: number;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  created_at: string;
  updated_at: string;
}

export function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchStatus = async () => {
    try {
      // In a real app, you'd fetch from a status API
      // For demo, we'll simulate service status
      const sampleServices: ServiceStatus[] = [
        {
          name: 'OmniPost API',
          status: 'operational',
          description: 'All systems operational',
          last_updated: new Date().toISOString(),
          response_time: 145
        },
        {
          name: 'Discord Integration',
          status: 'operational',
          description: 'Publishing to Discord working normally',
          last_updated: new Date().toISOString(),
          response_time: 89
        },
        {
          name: 'Telegram Integration',
          status: 'operational',
          description: 'Publishing to Telegram working normally',
          last_updated: new Date().toISOString(),
          response_time: 112
        },
        {
          name: 'Whop Integration',
          status: 'operational',
          description: 'Publishing to Whop working normally',
          last_updated: new Date().toISOString(),
          response_time: 203
        },
        {
          name: 'AI Services',
          status: 'operational',
          description: 'Content generation and optimization available',
          last_updated: new Date().toISOString(),
          response_time: 1250
        },
        {
          name: 'Database',
          status: 'operational',
          description: 'Data storage and retrieval working normally',
          last_updated: new Date().toISOString(),
          response_time: 45
        }
      ];

      const sampleIncidents: Incident[] = [
        // No current incidents for demo
      ];

      setServices(sampleServices);
      setIncidents(sampleIncidents);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'outage':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'outage':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('API')) return Globe;
    if (serviceName.includes('Database')) return Database;
    if (serviceName.includes('AI')) return Zap;
    return Activity;
  };

  const overallStatus = services.every(s => s.status === 'operational') 
    ? 'operational' 
    : services.some(s => s.status === 'outage') 
    ? 'outage' 
    : 'degraded';

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(overallStatus)}
              <div>
                <h2 className="text-xl font-semibold">
                  {overallStatus === 'operational' ? 'All Systems Operational' : 
                   overallStatus === 'degraded' ? 'Some Systems Degraded' : 
                   'Service Disruption'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(overallStatus)}>
                {overallStatus.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchStatus}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Incidents */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Current Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div key={incident.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{incident.title}</h4>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                      <Badge variant="outline">
                        {incident.severity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {incident.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Started: {new Date(incident.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => {
              const ServiceIcon = getServiceIcon(service.name);
              
              return (
                <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <ServiceIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                      {service.response_time && (
                        <p className="text-xs text-muted-foreground">
                          Response time: {service.response_time}ms
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Historical Uptime */}
      <Card>
        <CardHeader>
          <CardTitle>90-Day Uptime</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.slice(0, 3).map((service) => (
              <div key={service.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{service.name}</span>
                  <span className="font-medium">99.9% uptime</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 90 }, (_, i) => (
                    <div
                      key={i}
                      className="h-8 flex-1 bg-green-500 rounded-sm"
                      title={`Day ${i + 1}: Operational`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>Operational</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                <span>Degraded</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span>Outage</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                <span>Maintenance</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
