document.addEventListener('DOMContentLoaded', () => {
    const radioInputs = document.querySelectorAll('input[type="radio"][name="age"]');
    const progressBar = document.querySelector('.progress-bar-active');
    
    // Animate progress bar entry
    setTimeout(() => {
        progressBar.style.width = '20%';
    }, 300);

    // Add click listeners to handle selection and simulate navigation
    radioInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if(e.target.checked) {
                // Update progress bar
                progressBar.style.width = '40%';
                
                // Add a small delay for user to see the selection before "navigating"
                setTimeout(() => {
                    const card = e.target.closest('.option-card');
                    card.style.transform = 'scale(0.98)'; // click down effect
                    
                    setTimeout(() => {
                        // After click effect, you would typically route to the next view
                        console.log(`Selected age group: ${e.target.value}. Transitioning to next screen...`);
                        
                        // Simulate route transition by fading out the current screen
                        const screen = document.getElementById('screen-2dfcd9d6');
                        screen.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        screen.style.opacity = '0';
                        screen.style.transform = 'translateY(-15px)';
                    }, 150);
                }, 300);
            }
        });
    });

    // Skip button interactions
    const skipBtn = document.querySelector('.btn-skip');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            console.log('Skipping step...');
            progressBar.style.width = '40%';
            
            const screen = document.getElementById('screen-2dfcd9d6');
            screen.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            screen.style.opacity = '0';
            screen.style.transform = 'translateY(-15px)';
        });
    }
});
