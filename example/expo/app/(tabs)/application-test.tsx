import { useState } from 'react';
import { StyleSheet, TextInput, Alert } from 'react-native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { VStack } from '@/components/ui/vstack';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';

interface EventResult {
  success: boolean;
  message: string;
  timestamp: string;
}

export default function ApplicationTestScreen() {
  const [applicationId, setApplicationId] = useState('');
  const [serverUrl, setServerUrl] = useState('http://localhost:12345');
  const [eventName, setEventName] = useState('test_event');
  const [eventData, setEventData] = useState('{"value": 1, "action": "click"}');
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme() ?? 'light';

  const sendApplicationEvent = async () => {
    if (!applicationId) {
      Alert.alert('Error', 'Please enter application ID');
      return;
    }

    try {
      setLoading(true);
      const timestamp = new Date().toISOString();

      const payload = {
        application: applicationId,
        name: eventName,
        data: JSON.parse(eventData),
        url: 'app://tianji-expo-example',
        os: 'iOS', // 可以根据实际平台动态获取
        language: 'zh-CN',
      };

      const response = await fetch(`${serverUrl}/api/application/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'event',
          payload,
        }),
      });

      if (response.ok) {
        const result = await response.text();
        setResults((prev) => [
          {
            success: true,
            message: `Event sent successfully: ${result}`,
            timestamp,
          },
          ...prev,
        ]);
      } else {
        const errorText = await response.text();
        setResults((prev) => [
          {
            success: false,
            message: `Error: ${response.status} - ${errorText}`,
            timestamp,
          },
          ...prev,
        ]);
      }
    } catch (error) {
      setResults((prev) => [
        {
          success: false,
          message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendIdentifyEvent = async () => {
    if (!applicationId) {
      Alert.alert('Error', 'Please enter application ID');
      return;
    }

    try {
      setLoading(true);
      const timestamp = new Date().toISOString();

      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'premium',
        signupDate: new Date().toISOString(),
      };

      const payload = {
        application: applicationId,
        data: userData,
        os: 'iOS',
        language: 'zh-CN',
      };

      const response = await fetch(`${serverUrl}/api/application/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'identify',
          payload,
        }),
      });

      if (response.ok) {
        const result = await response.text();
        setResults((prev) => [
          {
            success: true,
            message: `User identification event sent successfully: ${result}`,
            timestamp,
          },
          ...prev,
        ]);
      } else {
        const errorText = await response.text();
        setResults((prev) => [
          {
            success: false,
            message: `Error: ${response.status} - ${errorText}`,
            timestamp,
          },
          ...prev,
        ]);
      }
    } catch (error) {
      setResults((prev) => [
        {
          success: false,
          message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Application Event Test</ThemedText>
        <IconSymbol
          name="app.badge.fill"
          size={28}
          color={colorScheme === 'light' ? Colors.light.tint : Colors.dark.tint}
        />
      </ThemedView>

      <Collapsible title="Configuration">
        <VStack space="md" style={styles.formSection}>
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Server Address</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="Enter server address"
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Application ID</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                value={applicationId}
                onChangeText={setApplicationId}
                placeholder="Enter application ID"
              />
            </Input>
          </FormControl>
        </VStack>
      </Collapsible>

      <Collapsible title="Custom Event">
        <VStack space="md" style={styles.formSection}>
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Event Name</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                value={eventName}
                onChangeText={setEventName}
                placeholder="Enter event name"
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Event Data (JSON)</FormControlLabelText>
            </FormControlLabel>
            <TextInput
              style={[
                styles.jsonInput,
                {
                  backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#333',
                },
              ]}
              value={eventData}
              onChangeText={setEventData}
              placeholder="Enter JSON format event data"
              multiline
              numberOfLines={4}
            />
          </FormControl>

          <Button onPress={sendApplicationEvent} isDisabled={loading}>
            <ButtonText>Send Custom Event</ButtonText>
          </Button>
        </VStack>
      </Collapsible>

      <Collapsible title="User Identification Event">
        <VStack space="md" style={styles.formSection}>
          <ThemedText>
            Send user identification event, including user ID, email and other
            information
          </ThemedText>
          <Button onPress={sendIdentifyEvent} isDisabled={loading}>
            <ButtonText>Send User Identification Event</ButtonText>
          </Button>
        </VStack>
      </Collapsible>

      <Collapsible title="Test Results">
        <VStack space="md" style={styles.formSection}>
          <HStack className="items-center justify-between">
            <ThemedText type="subtitle">Event Sending Records</ThemedText>
            <Button size="sm" variant="outline" onPress={clearResults}>
              <ButtonText>Clear</ButtonText>
            </Button>
          </HStack>

          {results.length === 0 ? (
            <ThemedText>No records</ThemedText>
          ) : (
            results.map((result, index) => (
              <ThemedView
                key={index}
                style={[
                  styles.resultItem,
                  { borderColor: result.success ? '#4CAF50' : '#F44336' },
                ]}
              >
                <ThemedText>{result.timestamp}</ThemedText>
                <ThemedText
                  style={{ color: result.success ? '#4CAF50' : '#F44336' }}
                >
                  {result.message}
                </ThemedText>
              </ThemedView>
            ))
          )}
        </VStack>
      </Collapsible>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 12,
  },
  formSection: {
    marginBottom: 16,
  },
  jsonInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontFamily: 'SpaceMono',
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultItem: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});
