"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, MessageSquare, Clock } from "lucide-react";

export function StatsSection() {
  const stats = [
    {
      icon: <Users className="h-8 w-8" />,
      value: "10,000+",
      label: "Active Creators",
      description: "Growing community worldwide",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      value: "1M+",
      label: "Posts Published",
      description: "Across all platforms",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      value: "3.2x",
      label: "Average Engagement Boost",
      description: "Compared to manual posting",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      value: "15hrs",
      label: "Time Saved Weekly",
      description: "Per active user",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mx-auto mb-4 shadow-lg`}>
                  {stat.icon}
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="font-semibold text-foreground">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
