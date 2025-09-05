
"use client";

import { ContentTemplate } from "@/types/omnipost";
import { useRouter } from "next/navigation";
import { TemplateLibrary } from "@/components/templates/TemplateLibrary";

export default function TemplatesPage() {
  const router = useRouter();

  const handleUseContentTemplate = (selectedContentTemplate: ContentTemplate) => {
    // Navigate to composer with content template data
    const contentTemplateData = encodeURIComponent(JSON.stringify({
      title: selectedContentTemplate.name,
      content: selectedContentTemplate.template_content,
      template_id: selectedContentTemplate.id
    }));
    
    router.push(`/composer?template=${contentTemplateData}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Templates</h1>
        <p className="text-muted-foreground">
          Save time with pre-built templates for common post types
        </p>
      </div>

      <TemplateLibrary onUseTemplate={handleUseContentTemplate} />
    </div>
  );
}
