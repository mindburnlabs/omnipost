
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Send, 
  Save, 
  Eye,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { BestTimeApplicator } from "./BestTimeApplicator";

interface SchedulingPanelProps {
  onSchedule: (date: Date) => void;
  onPublishNow: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
  isValid: boolean;
  loading: boolean;
  selectedPlatforms: number[];
  userTimezone?: string;
}

export function SchedulingPanel({
  onSchedule,
  onPublishNow,
  onSaveDraft,
  onPreview,
  isValid,
  loading,
  selectedPlatforms,
  userTimezone = 'UTC'
}: SchedulingPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSchedule = () => {
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
      onSchedule(scheduledDateTime);
    }
  };

  const handleBestTimeApply = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(format(date, 'HH:mm'));
    onSchedule(date);
  };

  return (
    <div className="space-y-4">
      {/* Best Time Recommendations */}
      <BestTimeApplicator
        onApplyTime={handleBestTimeApply}
        selectedPlatforms={selectedPlatforms}
        userTimezone={userTimezone}
      />

      {/* Manual Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Manual Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date and Time Selection */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setShowCalendar(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={onPublishNow}
              disabled={!isValid || loading}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Publishing...' : 'Publish Now'}
            </Button>
            
            <Button
              onClick={handleSchedule}
              disabled={!isValid || !selectedDate || loading}
              variant="outline"
              className="w-full"
            >
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'Scheduling...' : 'Schedule Post'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={onSaveDraft}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              
              <Button
                onClick={onPreview}
                disabled={!isValid}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>

          {/* Status Messages */}
          {!isValid && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Please fix validation issues before publishing.
              </p>
            </div>
          )}
          
          {selectedDate && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                Scheduled for {format(selectedDate, 'MMM dd, yyyy')} at {selectedTime} ({userTimezone})
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
