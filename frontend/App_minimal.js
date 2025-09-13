import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

export default function App() {
  const [messages, setMessages] = useState(['Hello', 'World']);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages(prev => [...prev, input]);
      setInput('');
    }
  };

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="light" />
      
      <Text style={styles.title}>Test App</Text>
      
      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg, i) => (
          <View key={`test-message-${i}-${msg}`} style={styles.messageBox}>
            <Text style={styles.messageText}>{msg}</Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  messageBox: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#16213e',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0f3460',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#e94560',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
