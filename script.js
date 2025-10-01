document.addEventListener('DOMContentLoaded', () => {

    // --- Logic for revealing the platform selection ---
    // (This part remains the same)
    const joinButtons = document.querySelectorAll('.cta-button');
    const platformSelection = document.getElementById('platform-selection');

    joinButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (platformSelection.classList.contains('hidden')) {
                platformSelection.classList.remove('hidden');
            }
            platformSelection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // --- Logic for scroll animations (Intersection Observer) ---
    // (This part remains the same)
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    animatedElements.forEach(element => { observer.observe(element); });

    // --- Logic for FAQ accordion ---
    // (This part remains the same)
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== question && otherQuestion.classList.contains('active')) {
                    otherQuestion.classList.remove('active');
                    otherQuestion.nextElementSibling.classList.remove('show');
                }
            });
            question.classList.toggle('active');
            answer.classList.toggle('show');
        });
    });

    // --- NEW: Seamless Page Transition Logic ---
    const transitionLinks = document.querySelectorAll('.platform-icon, .community-button');

    transitionLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            // Prevent the browser from navigating instantly
            event.preventDefault();
            
            const destination = link.href; // Get the URL to go to

            // Add the fade-out class to the body
            document.body.classList.add('fade-out');

            // Wait for the animation to finish, then navigate
            setTimeout(() => {
                window.location.href = destination;
            }, 500); // This duration should match the CSS transition time
        });
    });
});