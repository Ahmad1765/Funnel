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

    // ── Email via Vercel serverless + Gmail SMTP ─────────────────────
    async function sendQuizEmail() {
        // Filter raw internal IDs, keep all other entries as-is (no merging —
        // numbered labels like "Question?2" are different questions, not duplicates)
        const entries = Object.entries(quizAnswers).filter(([q, a]) =>
            a && !/^[a-z]{2,3}-[0-9a-f]{6,}$/i.test(q) && !/\[format\]/.test(q)
        );

        // Strip trailing digits from label for display only
        const rows = entries.map(([q, a]) => {
            const label = q.replace(/\s*\d+$/, '').trim();
            return `
                <tr>
                    <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#555;font-size:14px;width:48%;vertical-align:top;line-height:1.5;">${label}</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111;font-size:14px;font-weight:600;vertical-align:top;line-height:1.5;">${a}</td>
                </tr>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 36px;">
      <h1 style="margin:0 0 6px;color:#fff;font-size:22px;font-weight:700;">Quiz Completed</h1>
      <p style="margin:0;color:#a0aec0;font-size:14px;">Wrinkles Quiz &mdash; neue Einreichung</p>
    </div>

    <div style="padding:28px 36px 0;">
      <p style="margin:0 0 20px;color:#444;font-size:15px;">Ein Nutzer hat den Quiz abgeschlossen. Hier sind die Antworten:</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f7f8fa;">
            <th style="padding:10px 16px;text-align:left;font-size:11px;text-transform:uppercase;color:#888;letter-spacing:1px;font-weight:600;border-bottom:1px solid #e8e8e8;">Frage</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;text-transform:uppercase;color:#888;letter-spacing:1px;font-weight:600;border-bottom:1px solid #e8e8e8;">Antwort</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="padding:20px 36px 28px;margin-top:8px;">
      <p style="margin:0;color:#bbb;font-size:12px;">
        Eingereicht am ${new Date().toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' })}
      </p>
    </div>

  </div>
</body>
</html>`;

        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: 'Neuer Quiz-Abschluss – Wrinkles Quiz',
                    html,
                }),
            });
        } catch (err) {
            console.error('Email send failed:', err);
        }
    }

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
                // Final loader: email answers then go to Shopify store
                setTimeout(async () => {
                    await sendQuizEmail();
                    window.location.href = 'https://www.dr-melaxin.nl';
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
});
