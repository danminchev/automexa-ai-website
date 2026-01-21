document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // --- MOBILE ONLY: Move CTA button inside the menu ---
        const ctaBtn = document.querySelector('.nav-right .cta-top');
        if (ctaBtn) {
            const mobileCta = ctaBtn.cloneNode(true);
            mobileCta.classList.add('mobile-cta'); 
            // Ensures we don't have duplicate IDs if ID exists, though classes are safer
            mobileCta.removeAttribute('id');
            navLinks.appendChild(mobileCta);
        }
    }
});
