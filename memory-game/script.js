class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isPlaying = false;
        this.currentLevel = 0;
        this.backgroundMusic = null;
        this.isMusicPlaying = false;
        this.currentAudio = null; // Track currently playing audio

        this.letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.setupMusicControls();
        this.showLevelScreen();
    }

    setupEventListeners() {
        // Level selection buttons
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.target.dataset.level);
                this.startLevel(level);
            });
        });

        // Game control buttons
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('newLevelBtn').addEventListener('click', () => {
            this.showLevelScreen();
        });

        document.getElementById('quitGameBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to quit the game? Your progress will be lost.')) {
                window.location.href = '../index.html';
            }
        });

        // Success screen buttons
        document.getElementById('replayBtn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.showLevelScreen();
        });
    }

    setupMusicControls() {
        // Setup music controls for level screen
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
                this.backgroundMusic = new Audio('assets/audio/background-music.mp3');
                this.backgroundMusic.loop = true;
                this.backgroundMusic.volume = 0.3;
            }

            this.backgroundMusic.play().then(() => {
                this.isMusicPlaying = true;
                this.updateMusicButtonState();
            }).catch(e => {
                console.log('Background music not available:', e);
                this.createSimpleBackgroundMusic();
            });
        } catch (error) {
            console.log('Background music not available:', error);
            this.createSimpleBackgroundMusic();
        }
    }

    createSimpleBackgroundMusic() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
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

    stopAllAudio() {
        // Stop background music
        this.stopBackgroundMusic();

        // Stop any currently playing audio (like success sounds)
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
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

    showLevelScreen() {
        this.hideAllScreens();
        document.getElementById('levelScreen').classList.add('active');
        this.stopTimer();
        this.stopAllAudio(); // Stop all audio when going to level screen
        this.isPlaying = false;
    }

    startLevel(level) {
        this.currentLevel = level;
        this.totalPairs = level;
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.cards = [];
        this.flippedCards = [];

        this.stopAllAudio(); // Stop all audio when starting new level
        this.createCards();
        this.showGameScreen();
        this.startTimer();
        this.isPlaying = true;
    }

    createCards() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';

        // Create pairs of cards
        const selectedLetters = this.letters.slice(0, this.totalPairs);
        const cardPairs = [];

        selectedLetters.forEach(letter => {
            cardPairs.push(letter, letter);
        });

        // Shuffle the cards
        this.shuffleArray(cardPairs);

        // Create card elements
        cardPairs.forEach((letter, index) => {
            const card = this.createCard(letter, index);
            gameBoard.appendChild(card);
            this.cards.push(card);
        });
    }

    createCard(letter, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.letter = letter;
        card.dataset.index = index;

        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';

        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardBack.textContent = '?';

        // Try to load letter image
        const img = document.createElement('img');
        img.src = `assets/images/${letter}${letter.toLowerCase()}.png`;
        img.alt = letter;
        img.onerror = () => {
            // If image fails to load, use text
            cardFront.textContent = letter;
        };
        cardFront.appendChild(img);

        card.appendChild(cardFront);
        card.appendChild(cardBack);

        card.addEventListener('click', () => {
            this.flipCard(card);
        });

        return card;
    }

    flipCard(card) {
        if (!this.isPlaying || card.classList.contains('flipped') || card.classList.contains('matched') || this.flippedCards.length >= 2) {
            return;
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        this.playSound('flip');

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const letter1 = card1.dataset.letter;
        const letter2 = card2.dataset.letter;

        if (letter1 === letter2) {
            // Match found
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.flippedCards = [];
                this.matchedPairs++;
                this.updateDisplay();
                this.playLetterSound(letter1); // Play the specific letter sound

                if (this.matchedPairs === this.totalPairs) {
                    this.gameComplete();
                }
            }, 500);
        } else {
            // No match
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
            }, 1000);
        }
    }

    gameComplete() {
        this.stopTimer();
        this.isPlaying = false;
        this.stopBackgroundMusic(); // Stop background music when game completes
        this.playSound('success'); // Play success sound
        this.showSuccessScreen();
    }

    showSuccessScreen() {
        this.hideAllScreens();
        document.getElementById('successScreen').classList.add('active');

        document.getElementById('finalMoves').textContent = this.moves;
        document.getElementById('finalTime').textContent = this.formatTime(this.timer);
    }

    showGameScreen() {
        this.hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        this.updateDisplay();
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateDisplay() {
        document.getElementById('moveCount').textContent = this.moves;
        document.getElementById('timer').textContent = this.formatTime(this.timer);
        document.getElementById('pairsFound').textContent = this.matchedPairs;
        document.getElementById('totalPairs').textContent = this.totalPairs;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    restartGame() {
        this.stopAllAudio(); // Stop all audio including success sounds
        this.startLevel(this.currentLevel);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    playSound(soundType) {
        try {
            // Stop any currently playing audio first
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }

            let audioSrc = '';
            switch (soundType) {
                case 'flip':
                    audioSrc = 'assets/audio/flip.mp3';
                    break;
                case 'success':
                    audioSrc = 'assets/audio/success.mp3';
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

    playLetterSound(letter) {
        try {
            // Stop any currently playing audio first
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }

            // Play the specific letter audio file
            const audioSrc = `assets/audio/${letter}.mp3`;
            this.currentAudio = new Audio(audioSrc);
            this.currentAudio.volume = 0.5;
            this.currentAudio.play().catch(e => {
                console.log(`Letter audio ${letter}.mp3 not found, playing fallback sound:`, e);
                // Fallback to success sound if letter audio doesn't exist
                this.playSound('success');
            });
        } catch (error) {
            console.log('Letter audio not available:', error);
            // Fallback to success sound
            this.playSound('success');
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});
