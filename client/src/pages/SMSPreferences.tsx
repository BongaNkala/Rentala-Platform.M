import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Bell, AlertCircle, CheckCircle, Phone } from 'lucide-react';

interface SMSPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}

export default function SMSPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SMSPreference[]>([
    {
      id: 'rent_reminder',
      name: 'Rent Reminders',
      description: 'Receive SMS reminders 3 days before rent is due',
      enabled: true,
      icon: <Bell size={24} />,
    },
    {
      id: 'overdue_alert',
      name: 'Overdue Alerts',
      description: 'Receive SMS alerts when rent payment is overdue',
      enabled: true,
      icon: <AlertCircle size={24} />,
    },
    {
      id: 'payment_confirmation',
      name: 'Payment Confirmations',
      description: 'Receive SMS confirmation when payment is received',
      enabled: true,
      icon: <CheckCircle size={24} />,
    },
    {
      id: 'lease_expiry',
      name: 'Lease Expiry Notices',
      description: 'Receive SMS notification 30 days before lease expires',
      enabled: true,
      icon: <MessageSquare size={24} />,
    },
    {
      id: 'maintenance_updates',
      name: 'Maintenance Updates',
      description: 'Receive SMS updates on maintenance requests',
      enabled: true,
      icon: <MessageSquare size={24} />,
    },
  ]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load preferences from API
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // In a real app, fetch from tRPC
      // const prefs = await trpc.tenant.getSMSPreferences.useQuery();
      // setPreferences(prefs);
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const handleTogglePreference = (id: string) => {
    setPreferences(
      preferences.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // In a real app, save to tRPC
      // await trpc.tenant.updateSMSPreferences.useMutation(preferences);

      setSuccess('SMS preferences updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPhone = async () => {
    try {
      setSaving(true);
      setError(null);

      // In a real app, send verification code via SMS
      // await trpc.tenant.sendPhoneVerification.useMutation({ phoneNumber });

      setShowVerification(true);
      setSuccess('Verification code sent to your phone');
    } catch (err) {
      setError('Failed to send verification code');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmVerification = async () => {
    try {
      setSaving(true);
      setError(null);

      // In a real app, verify code via tRPC
      // await trpc.tenant.verifyPhoneNumber.useMutation({ phoneNumber, code: verificationCode });

      setIsVerified(true);
      setShowVerification(false);
      setSuccess('Phone number verified successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Invalid verification code');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SMS Preferences</h1>
          <p className="text-gray-400">Manage your SMS notification settings</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Phone Number Verification */}
        <Card className="bg-white/5 border-white/10 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Phone size={28} />
            Phone Number
          </h2>

          {!isVerified ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+27 123 456 7890"
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <Button
                    onClick={handleVerifyPhone}
                    disabled={!phoneNumber || saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? 'Sending...' : 'Verify'}
                  </Button>
                </div>
              </div>

              {showVerification && (
                <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-gray-400">
                    Enter the verification code sent to your phone
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"
                    />
                    <Button
                      onClick={handleConfirmVerification}
                      disabled={verificationCode.length !== 6 || saving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? 'Verifying...' : 'Confirm'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-400 flex items-center gap-2">
                <CheckCircle size={20} />
                Phone number verified: {phoneNumber}
              </p>
            </div>
          )}
        </Card>

        {/* SMS Preferences */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>

          <div className="space-y-4 mb-8">
            {preferences.map((pref) => (
              <Card
                key={pref.id}
                className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-blue-400 mt-1">{pref.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{pref.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">{pref.description}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleTogglePreference(pref.id)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      pref.enabled ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        pref.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleSavePreferences}
              disabled={saving || !isVerified}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
            {!isVerified && (
              <p className="text-gray-400 flex items-center gap-2">
                <AlertCircle size={18} />
                Verify your phone number to enable SMS notifications
              </p>
            )}
          </div>
        </div>

        {/* Information */}
        <Card className="mt-8 bg-white/5 border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">About SMS Notifications</h3>
          <div className="space-y-3 text-gray-400 text-sm">
            <p>
              • SMS notifications help you stay updated on important rent payments and property
              updates
            </p>
            <p>• Standard SMS rates may apply depending on your mobile provider</p>
            <p>• You can opt-out of individual notification types at any time</p>
            <p>• Your phone number is securely stored and never shared with third parties</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
