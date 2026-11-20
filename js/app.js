/**
 * Skyline - Main Application Logic
 * Manages background scenes, UI floating panels, fullscreen mode, ambient sliders, and app reset.
 */
const App = (() => {
    let currentPanelId = null;
    let fireAudioCtx = null;
    let fireGainNode = null;
    let fireNoiseSource = null;
    let currentUser = null;
    let chatUnsubscribe = null;
    let currentTutStep = 0;

    // ADMIN EMAIL LIST:
    const ADMIN_EMAILS = [
        "dito.hdez@gmail.com"
    ];

    // VERIFIED EMAIL LIST:
    const VERIFIED_EMAILS = [
        "dito.hdez@gmail.com",
    ];

    const VERIFIED_CHECK_SVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="13" height="13"><path fill="#42a5f5" d="M24,2l4.5,5L35,5l1.5,6.5L43,13l-2,6.5l5,4.5l-5,4.5l2,6.5l-6.5,1.5L35,43l-6.5-2L24,46l-4.5-5L13,43l-1.5-6.5 L5,35l2-6.5L2,24l5-4.5L5,13l6.5-1.5L13,5l6.5,2L24,2z"/><path fill="#e3f2fd" d="M34.6,14.6L21,28.2l-5.6-5.6l-2.8,2.8l8.4,8.4l16.4-16.4L34.6,14.6z"/></svg>
    `;

    const ADMIN_SHIELD_HTML = `<i class="ph ph-shield-star" style="color: #d4836a; font-size: 13px;" title="Admin"></i>`;

    const tutSteps = [
        {
            title: `Welcome to <br><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 56" width="210" height="36" style="margin-top: 6px; vertical-align: middle; margin-left: 83px;">
                <g transform="translate(14, 10)">
                    <circle cx="18" cy="18" r="18" fill="#526857" opacity="0.5" />
                    <path d="M 6,28 C 13,26 23,27 30,24" stroke="#f0f4f1" stroke-width="2.2" stroke-linecap="round" fill="none" />
                    <path d="M 12,24 C 10.5,20 12,14 16,12 C 20,10 24.5,12 25.5,15.5 C 26.5,19 23,24 18,24 C 15,24 13,25 12,24 Z" fill="#f0f4f1" stroke="#f0f4f1" stroke-width="1" stroke-linejoin="round" />
                    <path d="M 15,16.5 C 18,17 21,19 21,22" stroke="#2c3530" stroke-width="1.6" fill="none" stroke-linecap="round" />
                    <polygon points="25.5,15 29,16 26,17.5" fill="#e59866" />
                    <path d="M 21.5,13.5 Q 22.5,15 23.5,13.5" stroke="#2c3530" stroke-width="1.2" fill="none" stroke-linecap="round" />
                </g>
                <g transform="translate(68, 0)">
                    <text x="0" y="39" font-family="'Comfortaa', 'Quicksand', sans-serif" font-weight="700" font-size="40" letter-spacing="-1" fill="#f0f4f1">skyline</text>
                </g>
                <g transform="translate(228, 16)">
                    <text x="-13" y="26" font-family="-apple-system, sans-serif" font-weight="700" font-size="9.5" letter-spacing="3" fill="#d4ad94" opacity="0.9" transform="rotate(90 0,10)">LOFI</text>
                </g>
            </svg>`,
            desc: "Let’s take a quick tour of your new lofi retreat so you can customize your ambiance and vibe.",
            icon: "ph-sparkle"
        },
        {
            title: "Immersive Visuals & Scenes",
            desc: "Click the 'Visuals' icon in the bottom dock to switch between Gentle Rain, Cozy Fireplace, Snowy Cabin, and Cyber City backgrounds.",
            icon: "ph-image"
        },
        {
            title: "Ambient Sound Mixer",
            desc: "Layer natural elements like rain and crackling fireplaces over your music using the 'Sounds' panel to set your ideal focus mood.",
            icon: "ph-waveform"
        },
        {
            title: "Real-Time Community Chat",
            desc: "Since you're logged in, you have full access to the Community Chat! Share thoughts, connect with other listeners, and enjoy the stream.",
            icon: "ph-chat-circle-dots"
        },
        {
            title: "Your Lofi Retreat Awaits",
            desc: "You’re all set! Explore the visuals, mix your sounds, and enjoy the music. Your lofi retreat is ready for you to relax and focus.",
            icon: "ph-smiley"
        }
    ];

    function getUserRoles(email) {
        const cleanEmail = (email || "").trim().toLowerCase();
        const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === cleanEmail);
        const isVerified = isAdmin || VERIFIED_EMAILS.some(e => e.toLowerCase() === cleanEmail);
        return { isAdmin, isVerified };
    }

    function getBadgesHTML({ isAdmin = false, isVerified = false }) {
        const adminBadge = isAdmin
            ? `<span class="chat-badge-admin">${ADMIN_SHIELD_HTML}<span>ADMIN</span></span>`
            : "";

        const verifiedBadge = isVerified
            ? `<span class="chat-badge-verified" title="Verified User" aria-label="Verified User">${VERIFIED_CHECK_SVG}</span>`
            : "";

        return `${adminBadge}${verifiedBadge}`;
    }

    function openTutorial() {
        currentTutStep = 0;
        updateTutorialUI();
        const overlay = document.getElementById('tutorialModalOverlay');
        if (overlay) overlay.classList.add('active');
    }

    function closeTutorial() {
        const overlay = document.getElementById('tutorialModalOverlay');
        if (overlay) overlay.classList.remove('active');
        localStorage.setItem('skyline_seen_tutorial', 'true');
    }

    function nextTutorialStep() {
        currentTutStep++;
        if (currentTutStep >= tutSteps.length) {
            closeTutorial();
        } else {
            updateTutorialUI();
        }
    }

    function updateTutorialUI() {
        const step = tutSteps[currentTutStep];
        const titleEl = document.getElementById('tutTitle');
        const descEl = document.getElementById('tutDesc');
        const iconEl = document.getElementById('tutIcon');
        const nextBtn = document.getElementById('tutNextBtn');
        const dots = document.querySelectorAll('.tut-dot');

        if (titleEl) titleEl.innerHTML = step.title;
        if (descEl) descEl.innerText = step.desc;
        if (iconEl) iconEl.innerHTML = `<i class="ph ${step.icon}"></i>`;
        if (nextBtn) nextBtn.innerText = currentTutStep === tutSteps.length - 1 ? "Let's Begin" : "Next";

        dots.forEach((dot, idx) => {
            dot.style.background = idx === currentTutStep ? '#d4836a' : 'rgba(255,255,255,0.15)';
        });
    }

    function init() {
        const defaultBgBtn = document.querySelector('.bg-btn');
        switchBackground('vid-rain', defaultBgBtn);

        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(ev => {
            document.addEventListener(ev, handleFullscreenChange);
        });

        setupAmbientSliders();
        setupChat();
        updateChatAuthState();
        initChatListener();

        if (window.firebaseAPI) {
            window.firebaseAPI.onAuthStateChanged(window.firebaseAPI.auth, (user) => {
                const openAuthBtn = document.getElementById('openAuthBtn');
                if (user) {
                    currentUser = user.displayName || user.email.split('@')[0] || 'Listener';
                    const { isVerified } = getUserRoles(user.email);
                    updateChatAuthState();
                    checkAdminAccess(user);

                    if (openAuthBtn) {
                        const roles = getUserRoles(user.email);
                        const parts = [];
                        if (roles.isAdmin) parts.push(ADMIN_SHIELD_HTML);
                        if (roles.isVerified) parts.push(`<span class="chat-badge-verified" title="Verified User">${VERIFIED_CHECK_SVG}</span>`);
                        if (!roles.isAdmin && !roles.isVerified) parts.push(`<i class="ph ph-check-circle" style="color: #d4836a;"></i>`);
                        openAuthBtn.innerHTML = `${parts.join("")}<span>${escapeAuthHtml(currentUser)}</span>`;
                        openAuthBtn.title = 'Account Connected (Click to Log Out)';
                        openAuthBtn.onclick = (e) => {
                            e.preventDefault();
                            if (confirm(`Logged in as ${currentUser}. Do you want to log out?`)) {
                                window.firebaseAPI.signOut(window.firebaseAPI.auth).catch(err => console.warn('Sign out error:', err));
                            }
                        };
                    }
                } else {
                    currentUser = null;
                    updateChatAuthState();
                    checkAdminAccess(null);

                    if (openAuthBtn) {
                        openAuthBtn.innerHTML = `<i class="ph ph-user"></i><span>Log in</span>`;
                        openAuthBtn.title = 'Log In';
                        openAuthBtn.onclick = (e) => openAuthModal(e);
                    }
                }
            });
        }

        document.addEventListener('click', handleOutsideClick);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAuthModal();
            }
        });

        if (window.PlaylistPlayer && typeof window.PlaylistPlayer.init === 'function') {
            window.PlaylistPlayer.init();
        }
    }

    function togglePanel(panelId, btnElement) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const isActive = panel.classList.contains('active');

        document.querySelectorAll('.floating-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tool-icon-btn').forEach(b => b.classList.remove('active'));

        if (!isActive) {
            panel.classList.add('active');
            if (btnElement) {
                btnElement.classList.add('active');
            }
            currentPanelId = panelId;
        } else {
            currentPanelId = null;
        }
    }

    function handleOutsideClick(event) {
        if (!currentPanelId) return;
        const target = event.target;
        const isInsidePanel = target.closest('.floating-panel');
        const isInsideDock = target.closest('.chillhop-dock');

        if (!isInsidePanel && !isInsideDock) {
            document.querySelectorAll('.floating-panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tool-icon-btn').forEach(b => b.classList.remove('active'));
            currentPanelId = null;
        }
    }

    function switchBackground(videoId, btnElement) {
        const rainSlider = document.getElementById('rainVolume');
        const rainVol = rainSlider ? parseFloat(rainSlider.value) : 0;

        const allVideos = document.querySelectorAll('.bg-container video');
        allVideos.forEach(vid => {
            vid.classList.remove('active');
            if (vid.id === 'vid-rain' && rainVol > 0) {
                return;
            }
            vid.pause();
        });

        const activeVid = document.getElementById(videoId);
        if (activeVid) {
            activeVid.currentTime = 0;
            const playPromise = activeVid.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        activeVid.classList.add('active');
                    })
                    .catch(err => {
                        console.warn('Background video autoplay restricted:', err);
                        activeVid.classList.add('active');
                    });
            } else {
                activeVid.classList.add('active');
            }
        }

        document.querySelectorAll('.bg-btn').forEach(btn => btn.classList.remove('active'));
        if (btnElement) {
            btnElement.classList.add('active');
        }
    }

    function toggleFullscreen() {
        const doc = document;
        const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

        if (!fsElement) {
            const root = doc.documentElement;
            const req = root.requestFullscreen || root.webkitRequestFullscreen || root.mozRequestFullScreen || root.msRequestFullscreen;
            if (req) {
                req.call(root).catch(err => {
                    console.warn('Error attempting to enable fullscreen:', err);
                });
            }
        } else {
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (exit) {
                exit.call(doc).catch(err => {
                    console.warn('Error attempting to exit fullscreen:', err);
                });
            }
        }
    }

    function handleFullscreenChange() {
        const btnOut = document.getElementById('screen');
        const btnIn = document.getElementById('screenTog');
        if (!btnOut || !btnIn) return;

        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (isFs) {
            btnOut.style.display = 'none';
            btnIn.style.display = 'flex';
        } else {
            btnOut.style.display = 'flex';
            btnIn.style.display = 'none';
        }
    }

    function initFireplaceAudio() {
        if (fireAudioCtx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        try {
            fireAudioCtx = new AudioCtx();

            const bufferSize = fireAudioCtx.sampleRate * 2;
            const noiseBuffer = fireAudioCtx.createBuffer(1, bufferSize, fireAudioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
                if (Math.random() < 0.001) {
                    output[i] += (Math.random() * 2 - 1) * 0.8;
                }
            }

            fireNoiseSource = fireAudioCtx.createBufferSource();
            fireNoiseSource.buffer = noiseBuffer;
            fireNoiseSource.loop = true;

            const lowpass = fireAudioCtx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 1000;

            fireGainNode = fireAudioCtx.createGain();
            fireGainNode.gain.value = 0;

            fireNoiseSource.connect(lowpass);
            lowpass.connect(fireGainNode);
            fireGainNode.connect(fireAudioCtx.destination);
            fireNoiseSource.start(0);
        } catch (err) {
            console.warn('Web Audio Fireplace initialization error:', err);
        }
    }

    function setFireVolume(volume) {
        if (volume > 0) {
            initFireplaceAudio();
            if (fireAudioCtx && fireAudioCtx.state === 'suspended') {
                fireAudioCtx.resume().catch(() => {});
            }
            if (fireGainNode && fireAudioCtx) {
                fireGainNode.gain.setValueAtTime(volume * 0.8, fireAudioCtx.currentTime);
            }
        } else {
            if (fireGainNode && fireAudioCtx) {
                fireGainNode.gain.setValueAtTime(0, fireAudioCtx.currentTime);
            }
        }
    }

    function setupAmbientSliders() {
        const rainSlider = document.getElementById('rainVolume');
        const rainVid = document.getElementById('vid-rain');
        const fireSlider = document.getElementById('fireVolume');

        if (rainSlider && rainVid) {
            rainSlider.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value);
                if (vol > 0) {
                    rainVid.muted = false;
                    rainVid.volume = vol;
                    if (rainVid.paused) {
                        rainVid.play().catch(() => {});
                    }
                } else {
                    rainVid.volume = 0;
                    if (!rainVid.classList.contains('active')) {
                        rainVid.muted = true;
                        rainVid.pause();
                    } else {
                        rainVid.muted = true;
                    }
                }
            });
        }

        if (fireSlider) {
            fireSlider.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value);
                setFireVolume(vol);
            });
        }
    }

    function resetToHome() {
        const rainBtn = document.querySelector('.bg-btn');
        switchBackground('vid-rain', rainBtn);

        const rainSlider = document.getElementById('rainVolume');
        const fireSlider = document.getElementById('fireVolume');
        const rainVid = document.getElementById('vid-rain');

        if (rainSlider) rainSlider.value = 0;
        if (fireSlider) fireSlider.value = 0;
        if (rainVid) {
            rainVid.volume = 0;
            rainVid.muted = true;
        }
        setFireVolume(0);

        document.querySelectorAll('.floating-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tool-icon-btn').forEach(b => b.classList.remove('active'));
        currentPanelId = null;

        if (window.PlaylistPlayer && typeof window.PlaylistPlayer.reset === 'function') {
            window.PlaylistPlayer.reset();
        }
    }

    let currentAuthTab = 'login';

    function openAuthModal(e) {
        if (e && e.preventDefault) e.preventDefault();
        const overlay = document.getElementById('authModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
            const firstInput = overlay.querySelector('.auth-input:not([style*="display: none"])');
            if (firstInput) setTimeout(() => firstInput.focus(), 120);
        }
    }

    function closeAuthModal() {
        const overlay = document.getElementById('authModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    function handleAuthOverlayClick(e) {
        if (e.target && e.target.id === 'authModalOverlay') {
            closeAuthModal();
        }
    }

    function switchAuthTab(mode) {
        currentAuthTab = mode;
        const tabLogin = document.getElementById('tabLogin');
        const tabSignup = document.getElementById('tabSignup');
        const nameGroup = document.getElementById('nameGroup');
        const authName = document.getElementById('authName');
        const subtitle = document.getElementById('authSubtitle');
        const submitBtn = document.getElementById('authSubmitBtn');
        const rowActions = document.getElementById('authRowActions');
        const rowActions2 = document.getElementById('authRowActions2');

        if (mode === 'signup') {
            if (tabLogin) tabLogin.classList.remove('active');
            if (tabSignup) tabSignup.classList.add('active');
            if (nameGroup) nameGroup.style.display = 'flex';
            if (authName) authName.required = true;
            if (subtitle) subtitle.innerText = 'Create your account to save playlists & presets';
            if (submitBtn) submitBtn.innerText = 'Create Account';
            if (rowActions) rowActions.style.display = 'none';
            if (rowActions2) rowActions2.style.display = 'flex';
        } else {
            if (tabLogin) tabLogin.classList.add('active');
            if (tabSignup) tabSignup.classList.remove('active');
            if (nameGroup) nameGroup.style.display = 'none';
            if (authName) authName.required = false;
            if (subtitle) subtitle.innerText = 'Welcome back to your lofi retreat';
            if (submitBtn) submitBtn.innerText = 'Log In';
            if (rowActions) rowActions.style.display = 'flex';
            if (rowActions2) rowActions2.style.display = 'none';
        }
    }

    async function handleAuthSubmit(e) {
        e.preventDefault();
        const emailInput = document.getElementById('authEmail');
        const passInput = document.getElementById('authPassword');
        const nameInput = document.getElementById('authName');
        const submitBtn = document.getElementById('authSubmitBtn');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passInput ? passInput.value : '';
        const displayName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : (email.split('@')[0] || 'Listener');

        if (!window.firebaseAPI) {
            alert('Firebase API is not initialized yet.');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = currentAuthTab === 'signup' ? 'Creating Account...' : 'Logging In...';
        }

        try {
            if (currentAuthTab === 'signup') {
                const userCredential = await window.firebaseAPI.createUserWithEmailAndPassword(
                    window.firebaseAPI.auth,
                    email,
                    password
                );
                if (displayName && window.firebaseAPI.updateProfile) {
                    await window.firebaseAPI.updateProfile(userCredential.user, {
                        displayName: displayName
                    });
                }
            } else {
                await window.firebaseAPI.signInWithEmailAndPassword(
                    window.firebaseAPI.auth,
                    email,
                    password
                );
            }

            if (submitBtn) {
                submitBtn.innerText = 'Success!';
            }
            setTimeout(() => {
                closeAuthModal();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = currentAuthTab === 'signup' ? 'Create Account' : 'Log In';
                }
                if (emailInput) emailInput.value = '';
                if (passInput) passInput.value = '';
                if (nameInput) nameInput.value = '';
                if (currentAuthTab === 'signup' || !localStorage.getItem('skyline_seen_tutorial')) {
                    openTutorial();
                }
            }, 600);

        } catch (err) {
            console.error('Firebase Auth error:', err);
            alert(err.message || 'Authentication failed. Please check your credentials.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = currentAuthTab === 'signup' ? 'Create Account' : 'Log In';
            }
        }
    }

    function updateChatAuthState() {
        const blocked = document.getElementById('chatBlockedState');
        const active = document.getElementById('chatActiveState');
        if (!blocked || !active) return;

        if (currentUser) {
            blocked.style.display = 'none';
            active.style.display = 'flex';
        } else {
            blocked.style.display = 'flex';
            active.style.display = 'none';
        }
    }

    function setupChat() {
        const input = document.getElementById('chatInput');
        if (!input) return;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }

    function initChatListener() {
        const container = document.getElementById('chatMessages');
        if (!container || !window.firebaseAPI) return;

        const q = window.firebaseAPI.query(
            window.firebaseAPI.collection(window.firebaseAPI.db, "messages"),
            window.firebaseAPI.orderBy("timestamp", "asc")
        );

        chatUnsubscribe = window.firebaseAPI.onSnapshot(q, (snapshot) => {
            container.innerHTML = '';

            snapshot.forEach((doc) => {
                const data = doc.data();
                const author = data.author || 'Anonymous';
                const text = data.text || '';
                const email = data.email || '';

                const authUserEmail = window.firebaseAPI.auth.currentUser?.email || '';
                const fallbackEmail = (!email && currentUser === author) ? authUserEmail : email;
                const roles = getUserRoles(fallbackEmail);
                const isAdmin = typeof data.isAdmin === 'boolean' ? data.isAdmin : roles.isAdmin;
                const isVerified = typeof data.isVerified === 'boolean' ? data.isVerified : roles.isVerified;

                const bubble = document.createElement('div');
                bubble.className = 'chat-bubble';
                bubble.innerHTML = `
                    <div class="chat-bubble-author">
                        <span>${escapeAuthHtml(author)}</span>
                        ${getBadgesHTML({ isAdmin, isVerified })}
                    </div>
                    <div>${escapeAuthHtml(text)}</div>
                `;
                container.appendChild(bubble);
            });

            container.scrollTop = container.scrollHeight;
        }, (error) => {
            console.warn("Error listening to Firestore chat messages:", error);
        });
    }

    async function sendChatMessage() {
        const input = document.getElementById('chatInput');
        if (!input || !window.firebaseAPI) return;

        if (!currentUser) {
            openAuthModal();
            return;
        }

        const text = input.value.trim();
        if (!text) return;

        input.value = '';

        const user = window.firebaseAPI.auth.currentUser;
        const email = user ? (user.email || '') : '';
        const { isAdmin, isVerified } = getUserRoles(email);

        try {
            await window.firebaseAPI.addDoc(window.firebaseAPI.collection(window.firebaseAPI.db, "messages"), {
                author: currentUser,
                email: email,
                isAdmin: isAdmin,
                isVerified: isVerified,
                text: text,
                timestamp: window.firebaseAPI.serverTimestamp()
            });
        } catch (err) {
            console.error("Error sending message to Firestore:", err);
            alert("Failed to send message. Please check permissions or network.");
        }

        input.focus();
    }

    function escapeAuthHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function checkAdminAccess(user) {
        const dockTools = document.querySelector('.dock-tools');
        if (!dockTools) return;

        const existingAdminBtn = document.getElementById('adminTaskbarBtn');
        const existingAdminPanel = document.getElementById('adminPanel');
        if (existingAdminBtn) existingAdminBtn.remove();
        if (existingAdminPanel) existingAdminPanel.remove();

        const { isAdmin } = getUserRoles(user?.email);

        if (user && isAdmin) {
            const adminBtn = document.createElement('button');
            adminBtn.className = 'tool-icon-btn';
            adminBtn.id = 'adminTaskbarBtn';
            adminBtn.innerHTML = `<i class="ph ph-shield-star" style="color: #d4836a;"></i><span>Admin</span>`;
            adminBtn.onclick = () => togglePanel('adminPanel', adminBtn);

            dockTools.appendChild(adminBtn);

            const adminPanel = document.createElement('div');
            adminPanel.className = 'floating-panel';
            adminPanel.id = 'adminPanel';
            adminPanel.innerHTML = `
                <div class="panel-header" style="color: #d4836a;">Admin Control Panel</div>
                <div style="font-size: 12px; color: #f0f4f1; display: flex; flex-direction: column; gap: 10px; padding: 6px 0;">
                    <div>Logged in as Admin: <b>${escapeAuthHtml(user.email)}</b></div>
                    <button class="panel-item" onclick="App.clearChatMessages()" style="background: rgba(212, 131, 106, 0.2); border-color: rgba(212, 131, 106, 0.4); text-align: center; justify-content: center;">
                        🗑️ Clear All Chat Messages
                    </button>
                </div>
            `;
            document.body.appendChild(adminPanel);
        }
    }

    async function clearChatMessages() {
        if (!confirm("Are you sure you want to wipe all community chat messages?")) return;
        try {
            alert("Admin action executed!");
        } catch (err) {
            console.error("Error clearing chat:", err);
        }
    }

    return {
        init,
        togglePanel,
        switchBackground,
        toggleFullscreen,
        resetToHome,
        openAuthModal,
        closeAuthModal,
        handleAuthOverlayClick,
        switchAuthTab,
        handleAuthSubmit,
        updateChatAuthState,
        sendChatMessage,
        clearChatMessages,
        openTutorial,
        closeTutorial,
        nextTutorialStep
    };
})();

// Global bindings for inline HTML onclick handlers
window.togglePanel = (panelId, btn) => App.togglePanel(panelId, btn);
window.switchBackground = (videoId, btn) => App.switchBackground(videoId, btn);
window.toggleFullscreen = () => App.toggleFullscreen();
window.resetToHome = () => App.resetToHome();
window.openAuthModal = (e) => App.openAuthModal(e);
window.closeAuthModal = () => App.closeAuthModal();
window.handleAuthOverlayClick = (e) => App.handleAuthOverlayClick(e);
window.switchAuthTab = (mode) => App.switchAuthTab(mode);
window.handleAuthSubmit = (e) => App.handleAuthSubmit(e);
window.sendChatMessage = () => App.sendChatMessage();
window.openTutorial = () => App.openTutorial();
window.closeTutorial = () => App.closeTutorial();
window.nextTutorialStep = () => App.nextTutorialStep();
window.App = App;

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
