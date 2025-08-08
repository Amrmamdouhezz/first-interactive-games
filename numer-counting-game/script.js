class CountingGame {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
        this.maxLevels = 5;
        this.currentAnswer = 0;
        this.objects = [];
        this.currentAudio = null;
        this.backgroundMusic = null;
        this.isMusicPlaying = false;
        this.levelData = {}; // Store level data to prevent regeneration

        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.setupMusicControls();
        this.showStartScreen();
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // Check answer button
        document.getElementById('checkBtn').addEventListener('click', () => {
            this.checkAnswer();
        });

        // Enter key on input
        document.getElementById('answerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        // Play again button
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.restartGame();
        });

        // Quit game button
        document.getElementById('quitGameBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to quit the game? Your progress will be lost.')) {
                window.location.href = '../index.html';
            }
        });
    }

    setupMusicControls() {
        // Setup music controls for start screen
        const toggleMusicBtn = document.getElementById('toggleMusicBtn');
        const musicVolume = document.getElementById('musicVolume');

        if (toggleMusicBtn) {
            toggleMusicBtn.addEventListener('click', () => {
                this.toggleBackgroundMusic();
            });
        }

        if (musicVolume) {
            musicVolume.addEventListener('input', (e) => {
                this.setMusicVolume(e.target.value / 100);
            });
        }

        // Setup music controls for game screen
        const toggleMusicBtnGame = document.getElementById('toggleMusicBtnGame');
        const musicVolumeGame = document.getElementById('musicVolumeGame');

        if (toggleMusicBtnGame) {
            toggleMusicBtnGame.addEventListener('click', () => {
                this.toggleBackgroundMusic();
            });
        }

        if (musicVolumeGame) {
            musicVolumeGame.addEventListener('input', (e) => {
                this.setMusicVolume(e.target.value / 100);
            });
        }
    }

    toggleBackgroundMusic() {
        if (this.isMusicPlaying) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
    }

    playBackgroundMusic() {
        try {
            if (!this.backgroundMusic) {
                // Try to load background music file first
                this.backgroundMusic = new Audio('assets/audio/background-music.mp3');
                this.backgroundMusic.loop = true;
                this.backgroundMusic.volume = 0.3;
            }

            this.backgroundMusic.play().then(() => {
                this.isMusicPlaying = true;
                this.updateMusicButtonState();
            }).catch(e => {
                console.log('Background music file not found, creating simple music:', e);
                // If background music file doesn't exist, create a simple tone
                this.createSimpleBackgroundMusic();
            });
        } catch (error) {
            console.log('Background music not available:', error);
            this.createSimpleBackgroundMusic();
        }
    }

    createSimpleBackgroundMusic() {
        try {
            // Create a simple, pleasant background music using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a simple melody pattern
            const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major scale
            let currentNote = 0;

            const playNote = () => {
                if (!this.isMusicPlaying) return;

                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(notes[currentNote], audioContext.currentTime);

                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 1);

                currentNote = (currentNote + 1) % notes.length;

                // Schedule next note
                setTimeout(() => {
                    if (this.isMusicPlaying) {
                        playNote();
                    }
                }, 1000);
            };

            playNote();
            this.isMusicPlaying = true;
            this.updateMusicButtonState();

        } catch (error) {
            console.log('Simple background music creation failed:', error);
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
        this.isMusicPlaying = false;
        this.updateMusicButtonState();
    }

    setMusicVolume(volume) {
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = volume;
        }
    }

    updateMusicButtonState() {
        const buttons = ['toggleMusicBtn', 'toggleMusicBtnGame'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                if (this.isMusicPlaying) {
                    btn.textContent = '🔇 Stop Music';
                    btn.classList.add('playing');
                } else {
                    btn.textContent = '🎵 Play Music';
                    btn.classList.remove('playing');
                }
            }
        });
    }

    showStartScreen() {
        this.hideAllScreens();
        document.getElementById('startScreen').classList.add('active');
        this.stopAllAudio(); // Stop all audio when going to start screen
    }

    startGame() {
        // Stop any playing audio
        this.stopAllAudio(); // Stop all audio including success sounds

        this.currentLevel = 1;
        this.score = 0;
        this.levelData = {}; // Reset level data
        this.updateDisplay();
        this.loadLevel();
        this.showGameScreen();
    }

    loadLevel() {
        const levelData = this.getLevelData(this.currentLevel);
        this.currentAnswer = levelData.count;

        // Reset attempts for new level
        this.currentLevelAttempts = 0;

        // Update background image - use background.png for all levels
        const backgroundImg = document.getElementById('backgroundImg');
        if (backgroundImg) {
            backgroundImg.src = `assets/images/background.png`;
        }

        // Update question text
        const questionText = document.getElementById('questionText');
        if (questionText) {
            questionText.textContent = `How many ${levelData.objectName} do you see?`;
        }

        // Place objects
        this.placeObjects(levelData);

        // Clear previous feedback
        this.clearFeedback();

        // Focus on input
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.focus();
        }
    }

    getLevelData(level) {
        // If we already have data for this level, return it
        if (this.levelData[level]) {
            return this.levelData[level];
        }

        // Generate new level data
        const levelData = {
            1: { count: Math.floor(Math.random() * 10) + 1, objectName: 'apples', objectType: 'level-1' },
            2: { count: Math.floor(Math.random() * 15) + 5, objectName: 'zebras', objectType: 'level-2' },
            3: { count: Math.floor(Math.random() * 12) + 8, objectName: 'vans', objectType: 'level-3' },
            4: { count: Math.floor(Math.random() * 10) + 10, objectName: 'umbrellas', objectType: 'level-4' },
            5: { count: Math.floor(Math.random() * 8) + 12, objectName: 'cats', objectType: 'level-5' }
        };

        // Store the generated data
        this.levelData[level] = levelData[level] || {
            count: Math.floor(Math.random() * 20) + 1,
            objectName: 'objects',
            objectType: `level-${level}`
        };

        return this.levelData[level];
    }

    placeObjects(levelData) {
        const container = document.getElementById('objectsContainer');
        if (!container) return;

        container.innerHTML = '';
        this.objects = [];

        for (let i = 0; i < levelData.count; i++) {
            const object = this.createObject(levelData.objectType, i);
            container.appendChild(object);
            this.objects.push(object);
        }
    }

    createObject(objectType, index) {
        const object = document.createElement('img');
        object.className = 'counting-object';
        object.alt = objectType;

        // Try to load specific object image, fallback to level image
        object.src = `assets/images/${objectType}.png`;
        object.onerror = () => {
            // Fallback to level image if specific object image doesn't exist
            object.src = `assets/images/level-${this.currentLevel}.png`;
        };

        // Position objects in a grid-like pattern for better visibility with larger numbers
        const gridSize = Math.ceil(Math.sqrt(this.currentAnswer || 10)); // Calculate grid size based on number of objects
        const cellWidth = 70 / gridSize; // Reduced from 80 to 70 for wider gaps
        const cellHeight = 60 / gridSize; // Reduced from 70 to 60 for wider gaps

        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        // Add more spacing between objects and reduce randomness for better distribution
        const x = 15 + (col * cellWidth) + (Math.random() * (cellWidth * 0.4)); // Increased base from 10 to 15, reduced randomness
        const y = 15 + (row * cellHeight) + (Math.random() * (cellHeight * 0.4)); // Increased base from 10 to 15, reduced randomness

        object.style.left = `${x}%`;
        object.style.top = `${y}%`;

        // Add slight delay to animation for variety
        object.style.animationDelay = `${index * 0.2}s`;

        return object;
    }

    checkAnswer() {
        const input = document.getElementById('answerInput');
        if (!input) return;

        const userAnswer = parseInt(input.value);
        const feedback = document.getElementById('feedback');

        if (isNaN(userAnswer) || userAnswer < 1) {
            this.showFeedback('Please enter a valid number!', 'incorrect');
            return;
        }

        if (userAnswer === this.currentAnswer) {
            this.score++;
            this.showFeedback('🎉 Correct! Well done!', 'correct');
            this.playSound('correct');

            setTimeout(() => {
                this.nextLevel();
            }, 1500);
        } else {
            // Increment attempts for this level
            if (!this.currentLevelAttempts) {
                this.currentLevelAttempts = 0;
            }
            this.currentLevelAttempts++;
            this.updateDisplay(); // Update the display to show new attempt count

            if (this.currentLevelAttempts >= 2) {
                // Maximum attempts reached - show correct answer and move to next level
                this.showFeedback(`The correct answer was ${this.currentAnswer}. Let's try the next level!`, 'incorrect');
                this.playSound('incorrect');

                setTimeout(() => {
                    this.nextLevel();
                }, 2000);
            } else {
                // Still have attempts left
                this.showFeedback(`Try again! You have ${2 - this.currentLevelAttempts} more attempt(s).`, 'incorrect');
                this.playSound('incorrect');
                input.value = '';
                input.focus();
            }
        }
    }

    nextLevel() {
        this.currentLevel++;

        if (this.currentLevel > this.maxLevels) {
            this.gameComplete();
        } else {
            this.updateDisplay();
            this.loadLevel();
        }
    }

    gameComplete() {
        console.log('Game complete! Score:', this.score);
        const percentage = (this.score / this.maxLevels) * 100;

        if (percentage >= 70) {
            // Player passed with 70% or higher
            this.stopAllAudio(); // Stop all audio when game completes
            this.playSound('success');
            this.showSuccessScreen();
        } else {
            // Player didn't reach 70% - show retry message
            this.stopAllAudio(); // Stop all audio when game completes
            this.playSound('failure');
            this.showRetryScreen();
        }
    }

    showSuccessScreen() {
        console.log('Showing success screen');
        this.hideAllScreens();
        const successScreen = document.getElementById('successScreen');
        if (successScreen) {
            successScreen.classList.add('active');
        }

        const finalScore = document.getElementById('finalScore');
        if (finalScore) {
            finalScore.textContent = this.score;
        }

        // Calculate and display exact percentage
        const percentage = Math.round((this.score / this.maxLevels) * 100);
        const exactPercentage = document.getElementById('exactPercentage');
        if (exactPercentage) {
            exactPercentage.textContent = percentage;
        }
    }

    showRetryScreen() {
        console.log('Showing retry screen');
        this.hideAllScreens();

        // Create retry screen content
        const retryContent = `
            <div class="success-content">
                <div class="success-animation">
                    <h1>😔 Almost There!</h1>
                    <p>You got ${this.score} out of ${this.maxLevels} correct.</p>
                    <p>You need at least 4 correct answers (70%) to win!</p>
                    <div class="final-score">
                        <p>Your Score: <span>${this.score}</span>/5</p>
                    </div>
                </div>
                
                <div class="success-buttons">
                    <button class="success-btn" id="retryBtn">🔄 Try Again</button>
                    <button class="success-btn" onclick="window.location.href='../index.html'">🏠 Back to Home</button>
                </div>
            </div>
        `;

        // Add retry screen to DOM
        const retryScreen = document.createElement('div');
        retryScreen.id = 'retryScreen';
        retryScreen.className = 'screen active';
        retryScreen.innerHTML = retryContent;
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(retryScreen);
        }

        // Add event listener for retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }
    }

    showGameScreen() {
        this.hideAllScreens();
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.classList.add('active');
        }
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    updateDisplay() {
        const currentLevel = document.getElementById('currentLevel');
        const score = document.getElementById('score');
        const currentAttempts = document.getElementById('currentAttempts');

        if (currentLevel) currentLevel.textContent = this.currentLevel;
        if (score) score.textContent = this.score;
        if (currentAttempts) currentAttempts.textContent = this.currentLevelAttempts || 0;
    }

    showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.className = `feedback ${type}`;
        }
    }

    clearFeedback() {
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'feedback';
        }
    }

    restartGame() {
        // Stop any playing audio
        this.stopAllAudio(); // Stop all audio including success sounds

        this.currentLevel = 1;
        this.score = 0;
        this.levelData = {}; // Reset level data
        this.updateDisplay();
        this.loadLevel();
        this.showGameScreen();
    }

    stopAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    stopAllAudio() {
        // Stop background music
        this.stopBackgroundMusic();

        // Stop any currently playing audio (like success sounds)
        this.stopAudio();
    }

    playSound(soundType) {
        try {
            // Stop any currently playing audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }

            let audioSrc = '';
            switch (soundType) {
                case 'correct':
                    audioSrc = 'assets/audio/correct.mp3';
                    break;
                case 'incorrect':
                    audioSrc = 'assets/audio/incorrect.mp3';
                    break;
                case 'success':
                    audioSrc = 'assets/audio/success.mp3';
                    break;
                case 'failure':
                    audioSrc = 'assets/audio/failure.mp3';
                    break;
            }

            if (audioSrc) {
                this.currentAudio = new Audio(audioSrc);
                this.currentAudio.volume = 0.5;
                this.currentAudio.play().catch(e => console.log('Audio play failed:', e));
            }
        } catch (error) {
            console.log('Audio not available:', error);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CountingGame();
});
