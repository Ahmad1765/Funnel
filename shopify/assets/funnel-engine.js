document.addEventListener('DOMContentLoaded', () => {
    const sections = Array.from(document.querySelectorAll('section'));
    let currentIndex = 0;
    let isTransitioning = false;

    // ── Quiz answer tracking ──────────────────────────────────────────
    const quizAnswers = {};

    document.querySelectorAll('input[data-answer]').forEach(input => {
        input.addEventListener('change', () => {
            const question = input.getAttribute('data-label') || 'Frage';
            const answer   = input.getAttribute('data-answer') || input.value;

            if (input.type === 'radio') {
                quizAnswers[question] = answer;
            } else if (input.type === 'checkbox') {
                const existing = quizAnswers[question] ? quizAnswers[question].split(', ') : [];
                if (input.checked) {
                    if (!existing.includes(answer)) existing.push(answer);
                    quizAnswers[question] = existing.join(', ');
                } else {
                    const updated = existing.filter(a => a !== answer);
                    if (updated.length) quizAnswers[question] = updated.join(', ');
                    else delete quizAnswers[question];
                }
            }
        });
    });

    // Track date picker (eventDate variable)
    document.addEventListener('change', (e) => {
        if (
            e.target.getAttribute('data-variable') === 'eventDate' ||
            e.target.getAttribute('data-label') === 'Please select a date.'
        ) {
            quizAnswers['Event Datum'] = e.target.value;
        }
    });

    // Initial state setup
    sections.forEach((sec, idx) => {
        if (idx !== currentIndex) {
            sec.style.display = 'none';
            sec.classList.remove('visible');
        } else {
            sec.style.display = 'block';
            sec.classList.add('visible');
            sec.style.opacity = '1';
        }
    });

    // ── Loader handler ────────────────────────────────────────────────
    const checkLoader = (sec) => {
        const loader = sec.querySelector('[data-blocktype="loader"]');
        if (loader) {
            let timeout = 2000;
            let action  = 'next';

            try {
                const inner = loader.querySelector('[data-config]');
                if (inner) {
                    const config = JSON.parse(inner.getAttribute('data-config'));
                    if (config.timeout) timeout = config.timeout;
                    if (config.action)  action  = config.action;
                }
            } catch (e) {}

            if (action === 'redirect') {
                setTimeout(() => {
                    const redirectURL = 'https://jj4kky-c2.myshopify.com/';
                    if (window.parent !== window) {
                        window.parent.postMessage({ type: 'funnel-redirect', url: redirectURL }, '*');
                    } else {
                        window.location.href = redirectURL;
                    }
                }, timeout);
            } else {
                setTimeout(() => goNext(), timeout);
            }
        }
    };

    const updateProgress = () => {
        const bar = document.querySelector('.progress-bar-active');
        if (bar) {
            const pct = (currentIndex / (sections.length - 1)) * 100;
            bar.style.width = `${pct}%`;
        }
    };

    // ── iframe height helpers ─────────────────────────────────────────
    let _heightObserver = null;

    const sendHeight = (sec) => {
        if (window.parent === window) return;
        window.parent.postMessage({ type: 'funnel-resize', height: sec.scrollHeight }, '*');
    };

    const watchSection = (sec) => {
        if (_heightObserver) _heightObserver.disconnect();
        _heightObserver = new ResizeObserver(() => sendHeight(sec));
        _heightObserver.observe(sec);
        sec.querySelectorAll('img').forEach(img => {
            if (!img.complete) img.addEventListener('load', () => sendHeight(sec), { once: true });
        });
    };

    const goToIndex = (newIndex) => {
        if (isTransitioning) return;
        if (newIndex >= 0 && newIndex < sections.length) {
            isTransitioning = true;

            const currentSec = sections[currentIndex];
            currentSec.style.pointerEvents = 'none';
            currentSec.style.opacity = '0';

            setTimeout(() => {
                currentSec.style.display = 'none';
                currentSec.classList.remove('visible');

                currentIndex = newIndex;
                const nextSec = sections[currentIndex];

                nextSec.style.display = 'block';
                nextSec.classList.add('visible');

                void nextSec.offsetWidth;

                nextSec.style.opacity = '1';
                nextSec.style.pointerEvents = '';

                window.scrollTo({ top: 0, behavior: 'smooth' });
                updateProgress();
                checkLoader(nextSec);

                setTimeout(() => {
                    sendHeight(nextSec);
                    watchSection(nextSec);
                }, 50);

                isTransitioning = false;
            }, 300);
        }
    };

    const goNext = () => goToIndex(currentIndex + 1);

    // Auto-advance radios
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                setTimeout(goNext, 350);
            }
        });
    });

    // Checkbox option card click
    document.querySelectorAll('.multiple-choice-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const input = option.querySelector('input[type="checkbox"]');
            if (!input) return;
            if (e.target === input) return;
            if (e.target.tagName === 'LABEL' || e.target.closest('label')) return;
            input.checked = !input.checked;
        });
    });

    // All navigating buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            const action    = btn.getAttribute('data-action');
            const dest      = btn.getAttribute('data-destination');
            const isContinue = btn.classList.contains('continue');
            const isLink    = btn.classList.contains('link');

            if (!action && !dest && !isContinue && !isLink) return;

            if (dest && dest !== 'next') {
                const targetSection = document.getElementById(dest);
                if (targetSection) {
                    const targetIdx = sections.indexOf(targetSection);
                    if (targetIdx !== -1) {
                        goToIndex(targetIdx);
                        return;
                    }
                }
            }

            goNext();
        });
    });

    setTimeout(updateProgress, 100);
    checkLoader(sections[currentIndex]);

    setTimeout(() => {
        sendHeight(sections[currentIndex]);
        watchSection(sections[currentIndex]);
    }, 100);
    window.addEventListener('load', () => sendHeight(sections[currentIndex]));
});
