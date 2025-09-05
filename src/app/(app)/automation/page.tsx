
"use client";

import { AutomationRules } from "@/components/automation/AutomationRules";

export default function AutomationPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Automation</h1>
        <p className="text-muted-foreground">
          Set up rules to automate repetitive content tasks
        </p>
      </div>

      <AutomationRules />
    </div>
  );
}
