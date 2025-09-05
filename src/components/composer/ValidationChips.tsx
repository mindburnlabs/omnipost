
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, Link, Image, Type, Shield, Hash } from "lucide-react";
import { QualityGuard } from "@/components/quality/QualityGuard";
import { RepostGuardChip } from "@/components/quality/RepostGuardChip";

interface ValidationChipsProps {
  content: string;
  title: string;
  selectedPlatforms: number[];
  onContentChange?: (content: string) => void;
}

interface ValidationResult {
  type: string;
  status: 'passed' | 'warning' | 'failed';
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function ValidationChips({ content, title, selectedPlatforms, onContentChange }: ValidationChipsProps) {
  const [validations, setValidations] = useState<ValidationResult[]>([]);

  useEffect(() => {
    const runValidations = () => {
      const results: ValidationResult[] = [];

      // Character count validation
      const totalLength = (title + content).length;
      if (totalLength === 0) {
        results.push({
          type: 'character_count',
          status: 'failed',
          message: 'Content is empty',
          icon: Type
        });
      } else if (totalLength > 2000) {
        results.push({
          type: 'character_count',
          status: 'warning',
          message: `${totalLength} characters (very long)`,
          icon: Type
        });
      } else if (totalLength > 500) {
        results.push({
          type: 'character_count',
          status: 'warning',
          message: `${totalLength} characters (long)`,
          icon: Type
        });
      } else {
        results.push({
          type: 'character_count',
          status: 'passed',
          message: `${totalLength} characters`,
          icon: Type
        });
      }

      // Link detection (real validation happens in QualityGuard)
      const linkRegex = /https?:\/\/[^\s]+/g;
      const links = content.match(linkRegex) || [];
      if (links.length > 0) {
        results.push({
          type: 'link_check',
          status: 'passed',
          message: `${links.length} link${links.length !== 1 ? 's' : ''} found`,
          icon: Link
        });
      }

      // Image detection
      const imageRegex = /\.(jpg|jpeg|png|gif|webp)/gi;
      const images = content.match(imageRegex) || [];
      if (images.length > 0) {
        results.push({
          type: 'image_size',
          status: 'passed',
          message: `${images.length} image${images.length !== 1 ? 's' : ''} detected`,
          icon: Image
        });
      }

      // Platform selection validation
      if (selectedPlatforms.length === 0) {
        results.push({
          type: 'platform_compliance',
          status: 'warning',
          message: 'No platforms selected',
          icon: AlertTriangle
        });
      } else {
        results.push({
          type: 'platform_compliance',
          status: 'passed',
          message: `${selectedPlatforms.length} platform${selectedPlatforms.length !== 1 ? 's' : ''} selected`,
          icon: CheckCircle
        });
      }

      // Mention detection
      const mentions = content.match(/@\w+|<@[!&]?\d+>|<#\d+>/g) || [];
      if (mentions.length > 0) {
        results.push({
          type: 'mentions',
          status: 'warning',
          message: `${mentions.length} mention${mentions.length !== 1 ? 's' : ''} need verification`,
          icon: Hash
        });
      }

      setValidations(results);
    };

    runValidations();
  }, [content, title, selectedPlatforms]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Validation Chips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Repost Guard Chip */}
            {content.trim().length > 20 && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <RepostGuardChip
                  content={content}
                  title={title}
                  onContentChange={onContentChange}
                />
              </div>
            )}

            {/* Other validation chips */}
            {validations.map((validation, index) => {
              const IconComponent = validation.icon;
              return (
                <div key={index} className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <Badge className={getStatusColor(validation.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(validation.status)}
                      <span className="text-xs">{validation.message}</span>
                    </div>
                  </Badge>
                </div>
              );
            })}
          </div>
          
          {validations.some(v => v.status === 'failed') && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">
                Please fix the issues above before publishing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Quality Guard */}
      <QualityGuard
        content={content}
        title={title}
        selectedPlatforms={selectedPlatforms}
        onContentChange={onContentChange}
      />
    </div>
  );
}
