/**
 * Skyline - Playlist & Audio Player Logic
 * Manages playlist loading, audio playback, timeline seeking/scrubbing, and track history.
 */
const PlaylistPlayer = (() => {
    let tracklist = [];
    let currentTrackIdx = 0;
    let isPlaying = false;
    let isMuted = false;
    let isScrubbing = false;
    let pendingSeekPct = null;
    const audio = new Audio();

    // Cached DOM elements
    const elements = {};

    function init() {
        elements.title = document.getElementById('currentTrackTitle');
        elements.artist = document.getElementById('currentTrackArtist');
        elements.copyrightArtist = document.getElementById('copyrightArtist');
        elements.artImg = document.getElementById('currentArtImg');
        elements.artFallback = document.getElementById('currentArtFallback');
        elements.currentTime = document.getElementById('currentTime');
        elements.totalTime = document.getElementById('totalTime');
        elements.timeline = document.getElementById('dockTimeline');
        elements.progressFill = document.getElementById('progressFill');
        elements.playIcon = document.getElementById('playIcon');
        elements.muteBtn = document.getElementById('muteBtn');
        elements.trackListContainer = document.getElementById('dynamicTrackList');
        elements.historyList = document.getElementById('historyList');

        setupAudioListeners();
        setupTimelineScrubbing();
        loadMusicData();
    }

    function setupAudioListeners() {
        audio.addEventListener('timeupdate', () => {
            if (isScrubbing) return; // Do not overwrite timeline while user is dragging
            const duration = getTrackDuration();
            if (duration <= 0) return;

            const pct = Math.min(100, Math.max(0, (audio.currentTime / duration) * 100));
            if (elements.progressFill) {
                elements.progressFill.style.width = `${pct}%`;
            }
            if (elements.currentTime) {
                elements.currentTime.innerText = formatTime(audio.currentTime);
            }
        });

        audio.addEventListener('loadedmetadata', () => {
            if (elements.totalTime && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                elements.totalTime.innerText = formatTime(audio.duration);
            }
            if (pendingSeekPct !== null && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                const target = Math.max(0, Math.min(audio.duration, pendingSeekPct * audio.duration));
                try {
                    audio.currentTime = target;
                } catch (e) {
                    console.warn('Deferred seek error:', e);
                }
                pendingSeekPct = null;
            }
        });

        audio.addEventListener('ended', () => {
            nextTrack();
        });

        audio.addEventListener('play', () => {
            isPlaying = true;
            if (elements.playIcon) {
                elements.playIcon.className = 'ph ph-pause';
            }
        });

        audio.addEventListener('pause', () => {
            isPlaying = false;
            if (elements.playIcon) {
                elements.playIcon.className = 'ph ph-play';
            }
        });
    }

    function setupTimelineScrubbing() {
        const timeline = elements.timeline || document.getElementById('dockTimeline');
        if (!timeline) return;

        timeline.addEventListener('pointerdown', (e) => {
            isScrubbing = true;
            timeline.classList.add('scrubbing');
            timeline.setPointerCapture(e.pointerId);
            seekFromPointer(e);
        });

        timeline.addEventListener('pointermove', (e) => {
            if (!isScrubbing) return;
            seekFromPointer(e);
        });

        const stopScrubbing = (e) => {
            if (!isScrubbing) return;
            isScrubbing = false;
            timeline.classList.remove('scrubbing');
            if (timeline.hasPointerCapture && timeline.hasPointerCapture(e.pointerId)) {
                timeline.releasePointerCapture(e.pointerId);
            }
        };

        timeline.addEventListener('pointerup', stopScrubbing);
        timeline.addEventListener('pointercancel', stopScrubbing);
    }

    function seekFromPointer(e) {
        const timeline = elements.timeline || document.getElementById('dockTimeline');
        if (!timeline) return;

        const rect = timeline.getBoundingClientRect();
        if (rect.width <= 0) return;

        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        applySeek(pct);
    }

    function getTrackDuration() {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            return audio.duration;
        }
        const currentTrack = tracklist[currentTrackIdx];
        if (currentTrack && currentTrack.songLength) {
            const parts = currentTrack.songLength.split(':').map(Number);
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                return parts[0] * 60 + parts[1];
            }
        }
        return 0;
    }

    function applySeek(pct) {
        const duration = getTrackDuration();
        if (duration <= 0) return;

        const targetTime = Math.max(0, Math.min(duration, pct * duration));
        if (audio.readyState < 1 || isNaN(audio.duration)) {
            pendingSeekPct = pct;
        } else {
            pendingSeekPct = null;
            try {
                audio.currentTime = targetTime;
            } catch (err) {
                console.warn('Seeking error:', err);
                pendingSeekPct = pct;
            }
        }

        // Immediate responsive visual feedback
        if (elements.progressFill) {
            elements.progressFill.style.width = `${pct * 100}%`;
        }
        if (elements.currentTime) {
            elements.currentTime.innerText = formatTime(targetTime);
        }
    }

    function seekTrack(event) {
        seekFromPointer(event);
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    async function loadMusicData() {
        try {
            const res = await fetch('./song/playlist.json');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            tracklist = await res.json();

            renderTracklistPanel();
            if (tracklist.length > 0) {
                loadTrack(0, false);
            }
        } catch (err) {
            console.warn('Fetch for song/playlist.json failed, loading local fallback:', err);
            tracklist = [
                {
                    "songName": "Morning Petals",
                    "songAuthor": "The Skyline Sound Team",
                    "songImg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImcxIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZDQ4MzZhIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZTVhOTk1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIxNiIgZmlsbD0idXJsKCNnMSkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyNCIgZmlsbD0iIzJjMzUzMCIgb3BhY2l0eT0iMC4yIi8+PHRleHQgeD0iNTAiIHk9IjU4IiBmb250LXNpemU9IjI2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn4y4PC90ZXh0Pjwvc3ZnPg==",
                    "songLength": "00:30"
                },
                {
                    "songName": "Greenhouse Lofi",
                    "songAuthor": "Botanical Beats",
                    "songImg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImcyIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNTI2ODU3Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjODI5OTg0Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIxNiIgZmlsbD0idXJsKCNnMikiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyNCIgZmlsbD0iIzFiMjIxZSIgb3BhY2l0eT0iMC4yIi8+PHRleHQgeD0iNTAiIHk9IjU4IiBmb250LXNpemU9IjI2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn4y/PC90ZXh0Pjwvc3ZnPg==",
                    "songLength": "00:30"
                }
            ];
            renderTracklistPanel();
            if (tracklist.length > 0) {
                loadTrack(0, false);
            }
        }
    }

    function renderTracklistPanel() {
        if (!elements.trackListContainer) return;
        elements.trackListContainer.innerHTML = '';

        tracklist.forEach((track, index) => {
            const btn = document.createElement('button');
            btn.className = 'panel-item playlist-btn' + (index === currentTrackIdx ? ' active' : '');
            btn.innerHTML = `🎵 ${escapeHtml(track.songName)} <span style="margin-left:auto; font-size:11px; opacity:0.6;">${escapeHtml(track.songLength || '')}</span>`;
            btn.onclick = () => loadTrack(index, true);
            elements.trackListContainer.appendChild(btn);
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function loadTrack(index, autoPlay = true) {
        if (!tracklist || !tracklist[index]) return;
        currentTrackIdx = index;
        const track = tracklist[index];

        if (elements.title) elements.title.innerText = track.songName;
        if (elements.artist) elements.artist.innerText = track.songAuthor;
        if (elements.copyrightArtist) elements.copyrightArtist.innerText = track.songAuthor;
        if (elements.totalTime) elements.totalTime.innerText = track.songLength || '00:00';
        if (elements.currentTime) elements.currentTime.innerText = '00:00';
        if (elements.progressFill) elements.progressFill.style.width = '0%';

        // Handle artwork display
        if (track.songImg && track.songImg.trim() !== '') {
            if (elements.artImg) {
                elements.artImg.src = track.songImg;
                elements.artImg.style.display = 'block';
            }
            if (elements.artFallback) elements.artFallback.style.display = 'none';
        } else {
            if (elements.artImg) elements.artImg.style.display = 'none';
            if (elements.artFallback) elements.artFallback.style.display = 'inline';
        }

        // Set audio source & preload
        audio.src = `./src/${encodeURIComponent(track.songName)}.mp3`;
        audio.preload = 'auto';
        audio.load();

        // Update active highlight in tracklist panel
        if (elements.trackListContainer) {
            elements.trackListContainer.querySelectorAll('.playlist-btn').forEach((btn, i) => {
                btn.classList.toggle('active', i === index);
            });
        }

        if (autoPlay) {
            audio.play().then(() => {
                logToHistory(track);
            }).catch(e => {
                console.warn('Audio playback blocked or file missing:', e);
            });
        }
    }

    function togglePlay() {
        if (!audio.src) return;
        if (audio.paused) {
            audio.play().then(() => {
                if (tracklist[currentTrackIdx]) {
                    logToHistory(tracklist[currentTrackIdx]);
                }
            }).catch(e => {
                console.warn('Playback error:', e);
            });
        } else {
            audio.pause();
        }
    }

    function nextTrack() {
        if (!tracklist.length) return;
        loadTrack((currentTrackIdx + 1) % tracklist.length, true);
    }

    function prevTrack() {
        if (!tracklist.length) return;
        loadTrack((currentTrackIdx - 1 + tracklist.length) % tracklist.length, true);
    }

    function toggleMute() {
        isMuted = !isMuted;
        audio.muted = isMuted;
        if (elements.muteBtn) {
            elements.muteBtn.innerHTML = isMuted
                ? '<i class="ph ph-speaker-slash"></i>'
                : '<i class="ph ph-speaker-high"></i>';
        }
    }

    function logToHistory(track) {
        if (!elements.historyList) return;
        const text = `🎵 ${track.songName} — ${track.songAuthor}`;
        const first = elements.historyList.firstElementChild;
        if (first && first.innerText === text) return;

        const item = document.createElement('div');
        item.className = 'panel-item';
        item.style.cursor = 'default';
        item.innerText = text;
        elements.historyList.prepend(item);
    }

    function reset() {
        isMuted = false;
        audio.muted = false;
        if (elements.muteBtn) {
            elements.muteBtn.innerHTML = '<i class="ph ph-speaker-high"></i>';
        }
        if (tracklist.length > 0) {
            loadTrack(0, false);
            audio.pause();
            audio.currentTime = 0;
            isPlaying = false;
            if (elements.playIcon) {
                elements.playIcon.className = 'ph ph-play';
            }
        }
    }

    return {
        init,
        loadTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTrack,
        toggleMute,
        reset
    };
})();

// Global bindings for inline HTML onclick handlers
window.togglePlay = () => PlaylistPlayer.togglePlay();
window.nextTrack = () => PlaylistPlayer.nextTrack();
window.prevTrack = () => PlaylistPlayer.prevTrack();
window.seekTrack = (e) => PlaylistPlayer.seekTrack(e);
window.toggleMute = () => PlaylistPlayer.toggleMute();
window.PlaylistPlayer = PlaylistPlayer;
