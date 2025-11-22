import { useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from 'ahooks';
import removeMd from 'remove-markdown';

interface TTSItems {
  id: string;
  content: string;
}

interface UseTTSAnnouncementOptions {
  items: TTSItems[];
}

export function useTTSAnnouncement({ items }: UseTTSAnnouncementOptions) {
  const [isTTSEnabled, setIsTTSEnabled] = useLocalStorageState<boolean>(
    'tianji-feed-tts-enabled',
    {
      defaultValue: false,
    }
  );

  const [selectedVoiceURI, setSelectedVoiceURI] = useLocalStorageState<string>(
    'tianji-feed-tts-voice',
    {
      defaultValue: '',
    }
  );

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const previousEventIdsRef = useRef<Set<string>>(new Set());
  const speechQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Process speech queue
  const processQueue = () => {
    if (
      isProcessingQueueRef.current ||
      speechQueueRef.current.length === 0 ||
      !isTTSEnabled
    ) {
      return;
    }

    isProcessingQueueRef.current = true;
    setIsSpeaking(true);

    const text = speechQueueRef.current.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);

    // Set selected voice if available
    if (selectedVoiceURI && availableVoices.length > 0) {
      const voice = availableVoices.find(
        (v) => v.voiceURI === selectedVoiceURI
      );
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onend = () => {
      isProcessingQueueRef.current = false;
      if (speechQueueRef.current.length > 0) {
        processQueue();
      } else {
        setIsSpeaking(false);
      }
    };

    utterance.onerror = () => {
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      speechQueueRef.current = [];
    };

    window.speechSynthesis.speak(utterance);
  };

  // Add text to speech queue
  const addToQueue = (text: string) => {
    const plainText = removeMd(text).trim();
    if (plainText) {
      speechQueueRef.current.push(plainText);
      processQueue();
    }
  };

  // Detect new items and announce them
  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const currentEventIds = new Set(items.map((e) => e.id));

    // On first load, just initialize the previous event IDs without announcing
    if (!isInitializedRef.current) {
      previousEventIdsRef.current = currentEventIds;
      isInitializedRef.current = true;
      return;
    }

    // Only announce if TTS is enabled
    if (!isTTSEnabled) {
      previousEventIdsRef.current = currentEventIds;
      return;
    }

    const newEvents: TTSItems[] = [];

    // Find new items that weren't in the previous set
    items.forEach((event) => {
      if (!previousEventIdsRef.current.has(event.id)) {
        newEvents.push(event);
      }
    });

    // Update the previous event IDs
    previousEventIdsRef.current = currentEventIds;

    // Announce new items in order
    if (newEvents.length > 0) {
      newEvents.forEach((event) => {
        addToQueue(event.content);
      });
    }
  }, [items, isTTSEnabled]);

  const toggleTTS = () => {
    const newState = !isTTSEnabled;
    setIsTTSEnabled(newState);

    // Stop any ongoing speech when disabled
    if (!newState) {
      window.speechSynthesis.cancel();
      speechQueueRef.current = [];
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
    }
  };

  const testSpeak = (testText: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const plainText = removeMd(testText).trim() || 'Hello World';
    const utterance = new SpeechSynthesisUtterance(plainText);

    // Set selected voice if available
    if (selectedVoiceURI && availableVoices.length > 0) {
      const voice = availableVoices.find(
        (v) => v.voiceURI === selectedVoiceURI
      );
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isTTSEnabled: isTTSEnabled ?? false,
    toggleTTS,
    isSpeaking,
    availableVoices,
    selectedVoiceURI: selectedVoiceURI ?? '',
    setSelectedVoiceURI,
    testSpeak,
  };
}
