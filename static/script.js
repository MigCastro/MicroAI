document.addEventListener('DOMContentLoaded', () => {
    const activateButton = document.getElementById('activateButton');
    const responseDiv = document.getElementById('response');
    const aiState = document.getElementById('aiState');
    const ttsButton = document.getElementById('ttsButton');

    let aiStateValue = "off";
    aiState.textContent = "AI is sleeping";

    const microRecognition = new webkitSpeechRecognition();
    microRecognition.continuous = true;
    microRecognition.interimResults = true;

    const questionRecognition = new webkitSpeechRecognition();
    questionRecognition.continuous = false;
    questionRecognition.interimResults = false;

    let activeRecognition = null;

    microRecognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            console.log('Heard:', transcript);

            if (transcript.toLowerCase().includes("micro")) {
                aiStateValue = "listening";
                aiState.textContent = "AI is listening, ask a question";
                updateButtonStyle();
                activeRecognition = questionRecognition;
                questionRecognition.start();
                break; // Exit the loop to prevent multiple activations
            }
        }
    };

    questionRecognition.onresult = (event) => {
        const userQuestion = event.results[0][0].transcript;
        console.log('User Question:', userQuestion);

        if (userQuestion !== '') {
            askQuestion(userQuestion);
        }
    };

    activateButton.addEventListener('click', () => {
        if (aiStateValue === "off") {
            aiStateValue = "listening";
            aiState.textContent = "AI is listening, say 'Micro' to ask a question";
            updateButtonStyle();
            microRecognition.start();
            fetch('/activate_assistant', {
                method: 'POST',
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                activateButton.textContent = "On";
            })
            .catch(error => {
                console.error('Error activating AI:', error);
            });
        } else {
            aiStateValue = "off";
            aiState.textContent = "AI is sleeping";
            responseDiv.textContent = '';
            if (activeRecognition) {
                activeRecognition.stop();
                activeRecognition = null;
            }
            updateButtonStyle();
            activateButton.textContent = "Off";
        }
    });

    ttsButton.addEventListener('click', () => {
        const textToSpeak = responseDiv.textContent;
        if ('speechSynthesis' in window && textToSpeak) {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => voice.name === 'Microsoft David Desktop - English (United States)'); // Change to the desired voice
            utterance.voice = selectedVoice;
    
            // Add an event listener to turn on the microphone after TTS has finished speaking
            utterance.onend = () => {
                aiStateValue = "listening";
                aiState.textContent = "AI is listening, ask a question";
                updateButtonStyle();
                activeRecognition = questionRecognition; // Switch back to question recognition
                questionRecognition.start();
            };
    
            // Stop the microphone while TTS is speaking
            if (activeRecognition) {
                activeRecognition.stop();
                activeRecognition = null;
            }
    
            window.speechSynthesis.speak(utterance);
        }
    });
    
    

    function updateButtonStyle() {
        activateButton.className = aiStateValue;
    }

    function askQuestion(userQuestion) {
        console.log('Ask Question Function Called with:', userQuestion);
        fetch('/ask_question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `question=${encodeURIComponent(userQuestion)}`,
        })
        .then(response => response.json())
        .then(data => {
            console.log('API Response:', data);
            responseDiv.innerHTML = data.response;
    
            // Add Text-to-Speech here if needed
            speakResponse(data.response);
    
            // Turn the microphone back on to listen for "Micro"
            activeRecognition = microRecognition;
            microRecognition.start();
        })
        .catch(error => {
            console.error('Error asking question:', error);
        });
    }
    
    

    function speakResponse(text) {
        if ('speechSynthesis' in window && text) {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => voice.name === 'Microsoft David Desktop - English (United States)'); // Change to the desired voice
            utterance.voice = selectedVoice;
            window.speechSynthesis.speak(utterance);
        }
    }
});
