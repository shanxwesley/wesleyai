// Wesley AI Chatbot with OpenRouter Integration and Voice Features
class WesleyBot {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeModal = document.getElementById('closeModal');
        this.saveSettings = document.getElementById('saveSettings');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.modelSelect = document.getElementById('modelSelect');
        this.voiceToggle = document.getElementById('voiceToggle');
        this.voiceSpeedInput = document.getElementById('voiceSpeedInput');
        this.speedValue = document.getElementById('speedValue');

        // Speech Recognition Setup
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
        this.isListening = false;

        // Settings
        this.settings = this.loadSettings();
        this.conversationHistory = [];

        this.setupEventListeners();
        this.setupSpeechRecognition();
    }

    setupEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.clearBtn.addEventListener('click', () => this.clearChat());
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeModal.addEventListener('click', () => this.closeSettings());
        this.saveSettings.addEventListener('click', () => this.saveSettingsHandler());
        this.voiceSpeedInput.addEventListener('input', (e) => {
            this.speedValue.textContent = e.target.value + 'x';
        });

        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
    }

    setupSpeechRecognition() {
        if (!this.recognition) {
            console.warn('Speech Recognition not supported in this browser');
            return;
        }

        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.voiceBtn.classList.add('listening');
            this.voiceStatus.textContent = '🎤 Listening...';
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                this.userInput.value = finalTranscript.trim();
                this.voiceStatus.textContent = '✓ Got it!';
            } else if (interimTranscript) {
                this.voiceStatus.textContent = '🎤 ' + interimTranscript;
            }
        };

        this.recognition.onerror = (event) => {
            this.voiceStatus.textContent = '❌ Error: ' + event.error;
            console.error('Speech recognition error:', event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.voiceBtn.classList.remove('listening');
            setTimeout(() => {
                this.voiceStatus.textContent = '';
            }, 1500);
        };
    }

    toggleVoiceRecognition() {
        if (!this.recognition) {
            alert('Speech Recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.userInput.value = '';
            this.voiceStatus.textContent = '';
            this.recognition.start();
        }
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.userInput.value = '';
        this.userInput.focus();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get response from OpenRouter AI
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'wesley');

            // Speak the response if enabled
            if (this.settings.voiceEnabled) {
                this.speakText(response);
            }
        } catch (error) {
            this.hideTypingIndicator();
            const errorMessage = error.message || 'Sorry, I encountered an error. Please check your API key in settings.';
            this.addMessage(errorMessage, 'wesley');
            console.error('Error:', error);
        }
    }

    async getAIResponse(userMessage) {
        // Check if API key is set
        if (!this.settings.apiKey) {
            throw new Error('Please set your OpenRouter API key in settings first!');
        }

        // Build conversation context
        const messages = this.conversationHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        // Add current message
        messages.push({
            role: 'user',
            content: userMessage
        });

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.settings.apiKey}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Wesley AI Chatbot'
                },
                body: JSON.stringify({
                    model: this.settings.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500,
                    system: 'You are Wesley, a cute and friendly AI companion. Be warm, engaging, and helpful. Keep responses concise and friendly. Use emojis occasionally to be cute and expressive.'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenRouter API Error:', error);
            throw error;
        }
    }

    speakText(text) {
        // Use Web Speech API for text-to-speech
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-Speech not supported');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = parseFloat(this.settings.voiceSpeed);
        utterance.pitch = 0.8; // Lower pitch for boy voice
        utterance.volume = 1;
        utterance.lang = 'en-GB'; // British English

        // Find British male voice
        const voices = window.speechSynthesis.getVoices();
        let britishVoice = null;

        // Look for British English male voice
        for (let voice of voices) {
            if (voice.lang.includes('en-GB') || voice.lang.includes('en_GB')) {
                if (voice.name.includes('Male') || voice.name.includes('male') || 
                    voice.name.includes('Boy') || voice.name.includes('boy') ||
                    voice.name.includes('Daniel') || voice.name.includes('George')) {
                    britishVoice = voice;
                    break;
                }
            }
        }

        // If no specific male voice found, try any British voice
        if (!britishVoice) {
            for (let voice of voices) {
                if (voice.lang.includes('en-GB') || voice.lang.includes('en_GB')) {
                    britishVoice = voice;
                    break;
                }
            }
        }

        // Fallback to any available voice
        if (!britishVoice && voices.length > 0) {
            britishVoice = voices[0];
        }

        if (britishVoice) {
            utterance.voice = britishVoice;
        }

        window.speechSynthesis.speak(utterance);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = this.getCurrentTime();

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeSpan);

        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;

        this.conversationHistory.push({ sender, text });
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat? 🗑️')) {
            this.chatContainer.innerHTML = '';
            this.conversationHistory = [];
            this.addMessage("Hey there! 👋 I'm Wesley, your AI friend! I'm here to chat, answer questions, help with ideas, or just have a fun conversation. What's on your mind?", 'wesley');
        }
    }

    openSettings() {
        this.apiKeyInput.value = this.settings.apiKey;
        this.modelSelect.value = this.settings.model;
        this.voiceToggle.checked = this.settings.voiceEnabled;
        this.voiceSpeedInput.value = this.settings.voiceSpeed;
        this.speedValue.textContent = this.settings.voiceSpeed + 'x';
        this.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    saveSettingsHandler() {
        this.settings.apiKey = this.apiKeyInput.value.trim();
        this.settings.model = this.modelSelect.value;
        this.settings.voiceEnabled = this.voiceToggle.checked;
        this.settings.voiceSpeed = parseFloat(this.voiceSpeedInput.value);

        localStorage.setItem('wesleySettings', JSON.stringify(this.settings));
        alert('Settings saved! ✓');
        this.closeSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('wesleySettings');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            apiKey: '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',
            model: 'openai/gpt-3.5-turbo',
            voiceEnabled: true,
            voiceSpeed: 1
        };
    }
}

// Initialize Wesley when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WesleyBot();
});
