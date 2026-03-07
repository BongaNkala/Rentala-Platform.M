import React, { useState } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Mail, MessageSquare, Clock, Save, RotateCcw } from 'lucide-react';

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  overduePaymentAlerts: boolean;
  upcomingRentReminders: boolean;
  leaseExpirationNotices: boolean;
  maintenanceUpdates: boolean;
  overduePaymentDays: number[];
  upcomingRentDaysBefore: number;
  leaseExpirationDaysBefore: number;
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export default function NotificationPreferences() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    overduePaymentAlerts: true,
    upcomingRentReminders: true,
    leaseExpirationNotices: true,
    maintenanceUpdates: true,
    overduePaymentDays: [7, 14, 30],
    upcomingRentDaysBefore: 5,
    leaseExpirationDaysBefore: 30,
    emailFrequency: 'immediate',
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  };

  const handleNumberChange = (key: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
  };

  const handleArrayToggle = (key: string, value: number) => {
    setSettings(prev => {
      const arr = prev[key as keyof NotificationSettings] as number[];
      if (arr.includes(value)) {
        return {
          ...prev,
          [key]: arr.filter(v => v !== value),
        };
      } else {
        return {
          ...prev,
          [key]: [...arr, value].sort((a, b) => a - b),
        };
      }
    });
    setSaved(false);
  };

  const handleQuietHoursChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving notification preferences:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      emailNotifications: true,
      smsNotifications: true,
      overduePaymentAlerts: true,
      upcomingRentReminders: true,
      leaseExpirationNotices: true,
      maintenanceUpdates: true,
      overduePaymentDays: [7, 14, 30],
      upcomingRentDaysBefore: 5,
      leaseExpirationDaysBefore: 30,
      emailFrequency: 'immediate',
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    });
    setSaved(false);
  };

  return (
    <RentalaLayout pageTitle="Notification Preferences" pageSubtitle="Manage how and when you receive notifications">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Notification Preferences</h1>
        <p className="text-gray-400">Customize your notification settings and delivery preferences</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="mb-8 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
          ✓ Preferences saved successfully
        </div>
      )}

      {/* Notification Channels */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Notification Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <Mail size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Email Notifications</h3>
                  <p className="text-gray-400 text-sm">Receive alerts via email</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('emailNotifications')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : ''
                  }`}
                ></div>
              </button>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <MessageSquare size={24} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">SMS Notifications</h3>
                  <p className="text-gray-400 text-sm">Receive alerts via SMS</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('smsNotifications')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.smsNotifications ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.smsNotifications ? 'translate-x-6' : ''
                  }`}
                ></div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Notification Types */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Notification Types</h2>
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Overdue Payment Alerts</h3>
                <p className="text-gray-400 text-sm">Get notified when rent payments are overdue</p>
              </div>
              <button
                onClick={() => handleToggle('overduePaymentAlerts')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.overduePaymentAlerts ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.overduePaymentAlerts ? 'translate-x-6' : ''
                  }`}
                ></div>
              </button>
            </div>

            {settings.overduePaymentAlerts && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-gray-300 text-sm mb-3">Send alerts after:</p>
                <div className="flex flex-wrap gap-2">
                  {[7, 14, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => handleArrayToggle('overduePaymentDays', days)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        settings.overduePaymentDays.includes(days)
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Upcoming Rent Reminders</h3>
                <p className="text-gray-400 text-sm">Get reminded before rent is due</p>
              </div>
              <button
                onClick={() => handleToggle('upcomingRentReminders')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.upcomingRentReminders ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.upcomingRentReminders ? 'translate-x-6' : ''
                  }`}
                ></div>
              </button>
            </div>

            {settings.upcomingRentReminders && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-gray-300 text-sm mb-3">Remind me</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.upcomingRentDaysBefore}
                    onChange={(e) => handleNumberChange('upcomingRentDaysBefore', parseInt(e.target.value))}
                    className="w-16 bg-white/10 border border-white/20 text-white rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-300">days before rent is due</span>
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Lease Expiration Notices</h3>
                <p className="text-gray-400 text-sm">Get notified when leases are about to expire</p>
              </div>
              <button
                onClick={() => handleToggle('leaseExpirationNotices')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.leaseExpirationNotices ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.leaseExpirationNotices ? 'translate-x-6' : ''
                  }`}
                ></div>
              </button>
            </div>

            {settings.leaseExpirationNotices && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-gray-300 text-sm mb-3">Notify me</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={settings.leaseExpirationDaysBefore}
                    onChange={(e) => handleNumberChange('leaseExpirationDaysBefore', parseInt(e.target.value))}
                    className="w-16 bg-white/10 border border-white/20 text-white rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-gray-300">days before lease expires</span>
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Maintenance Updates</h3>
                <p className="text-gray-400 text-sm">Get notified about maintenance requests</p>
              </div>
              <button
                onClick={() => handleToggle('maintenanceUpdates')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.maintenanceUpdates ? 'bg-orange-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.maintenanceUpdates ? 'translate-x-6' : ''
                  }`}
                ></div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Quiet Hours</h2>
        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Clock size={24} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Do Not Disturb</h3>
              <p className="text-gray-400 text-sm">Pause notifications during specific hours</p>
            </div>
            <button
              onClick={() => handleQuietHoursChange('enabled', !settings.quietHours.enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ml-auto ${
                settings.quietHours.enabled ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.quietHours.enabled ? 'translate-x-6' : ''
                }`}
              ></div>
            </button>
          </div>

          {settings.quietHours.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Start Time</label>
                  <input
                    type="time"
                    value={settings.quietHours.startTime}
                    onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">End Time</label>
                  <input
                    type="time"
                    value={settings.quietHours.endTime}
                    onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          <Save size={18} className="mr-2" />
          Save Preferences
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw size={18} className="mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </RentalaLayout>
  );
}
