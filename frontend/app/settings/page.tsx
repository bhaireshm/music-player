'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Box,
  Card,
  SegmentedControl,
  Switch,
  Button,
  Group,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getUserSettings, updateUserSettings, UserSettings, getUserProfile } from '@/lib/api';

function SettingsPageContent() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsData, profileData] = await Promise.all([
        getUserSettings(),
        getUserProfile(),
      ]);
      setSettings(settingsData);
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await updateUserSettings(settings);
      
      notifications.show({
        title: 'Success',
        message: 'Settings saved successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save settings',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <Box pb={90}>
        <Container size="lg" py="xl">
          <Text>Loading...</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box pb={90}>
      <Container size="lg" py="xl">
        {/* Page Header */}
        <Stack gap="xs" mb="xl">
          <Title order={1}>Settings</Title>
          <Text c="dimmed" size="sm">
            Customize your music player experience
          </Text>
        </Stack>

        <Stack gap="md">
          {/* Theme Settings */}
          <Card shadow="sm" padding="lg" radius="md">
            <Stack gap="md">
              <div>
                <Text size="lg" fw={600} mb="xs">
                  Appearance
                </Text>
                <Text size="sm" c="dimmed">
                  Customize how the app looks
                </Text>
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">
                  Theme
                </Text>
                <SegmentedControl
                  value={settings.theme}
                  onChange={(value) =>
                    setSettings({ ...settings, theme: value as 'light' | 'dark' | 'system' })
                  }
                  data={[
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                    { label: 'System', value: 'system' },
                  ]}
                  fullWidth
                />
              </div>
            </Stack>
          </Card>

          {/* Notification Settings */}
          <Card shadow="sm" padding="lg" radius="md">
            <Stack gap="md">
              <div>
                <Text size="lg" fw={600} mb="xs">
                  Notifications
                </Text>
                <Text size="sm" c="dimmed">
                  Manage your notification preferences
                </Text>
              </div>

              <Switch
                label="Enable notifications"
                checked={settings.notifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: e.currentTarget.checked,
                  })
                }
              />
            </Stack>
          </Card>

          {/* Account Information */}
          <Card shadow="sm" padding="lg" radius="md">
            <Stack gap="md">
              <div>
                <Text size="lg" fw={600} mb="xs">
                  Account Information
                </Text>
                <Text size="sm" c="dimmed">
                  Your account details
                </Text>
              </div>

              <Divider />

              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Email
                </Text>
                <Text size="sm">{profile?.email}</Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Display Name
                </Text>
                <Text size="sm">{profile?.displayName || 'Not set'}</Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Member Since
                </Text>
                <Text size="sm">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : 'Unknown'}
                </Text>
              </Group>
            </Stack>
          </Card>

          {/* Save Button */}
          <Group justify="flex-end">
            <Button
              onClick={handleSave}
              loading={saving}
              variant="gradient"
              gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
            >
              Save Settings
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
