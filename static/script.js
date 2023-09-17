document.addEventListener('DOMContentLoaded', () => {
    const activateButton = document.getElementById('activateButton');
    const responseDiv = document.getElementById('response');
    const aiState = document.getElementById('aiState');
    const ttsButton = document.getElementById('ttsButton');

    let aiStateValue = "off";
    aiState.textContent = "AI is sleeping";
    let heardMicro = false;
    let isSpeaking = false;

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

            if (transcript.toLowerCase().includes("micro") && !heardMicro) {
                heardMicro = true;
                aiStateValue = "listening";
                aiState.textContent = "AI is listening, ask a question";
                updateButtonStyle();
                activeRecognition = questionRecognition;
                questionRecognition.start();
            } else if (transcript.toLowerCase().includes("micro") && heardMicro) {
                aiStateValue = "listening";
                aiState.textContent = "AI is listening, ask a question";
                updateButtonStyle();
                activeRecognition = questionRecognition;
                questionRecognition.start();
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
                if (audioOff.paused) {
                    audioOn.play();
                }
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
    
            microRecognition.stop();
    
            heardMicro = false;
            updateButtonStyle();
            activateButton.textContent = "Off";
            
            if (!audioOn.paused) {
                audioOn.pause();
                audioOn.currentTime = 0;
            }
            
            if (audioOff.paused) {
                audioOff.play();
            }
    
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                isSpeaking = false;
            }
        }
    });

    ttsButton.addEventListener('click', () => {
        const textToSpeak = responseDiv.textContent;
        if ('speechSynthesis' in window && textToSpeak) {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => voice.name === 'Microsoft David Desktop - English (United States)');
            utterance.voice = selectedVoice;
            window.speechSynthesis.speak(utterance);
            isSpeaking = true;

            utterance.onend = () => {
                if (aiStateValue === "off") {
                    window.speechSynthesis.cancel();
                    isSpeaking = false;
                } else {
                    activeRecognition = microRecognition;
                    microRecognition.start();
                }
            };
        }
    });

    function updateButtonStyle() {
        activateButton.className = aiStateValue;
    }

    function askQuestion(userQuestion) {
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
            if (data.response === "I couldn't understand the question.") {
                responseDiv.innerHTML = "I had some trouble with that, try again.";
            } else {
                responseDiv.innerHTML = data.response;
            }
            speakResponse(data.response);
        })
        .catch(error => {
            console.error('Error asking question:', error);
            responseDiv.innerHTML = "I had some trouble with that, try again.";
        });
    }
    
    function speakResponse(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.name === 'Microsoft David Desktop - English (United States)');
        utterance.voice = selectedVoice;
        window.speechSynthesis.speak(utterance);

        isSpeaking = true;

        utterance.onend = () => {
            if (aiStateValue === "off") {
                window.speechSynthesis.cancel();
                isSpeaking = false;
            } else {
                activeRecognition = microRecognition;
                microRecognition.start();
            }
        };
    }
});
