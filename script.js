document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Navigation (Hamburger Menu) ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Change icon to 'X' when menu is active
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when a link is clicked
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    const icon = menuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }


    // --- "Join Now" Button Functionality ---
    const ctaButton = document.querySelector('.cta-button');
    const platformSelection = document.getElementById('platform-selection');

    if (ctaButton && platformSelection) {
        ctaButton.addEventListener('click', () => {
            platformSelection.classList.remove('hidden');
            // Smoothly scroll to the platform selection section
            platformSelection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    

    // --- FAQ Accordion ---
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isActive = question.classList.contains('active');
            
            // Close all other open answers
            document.querySelectorAll('.faq-question.active').forEach(activeQuestion => {
                if (activeQuestion !== question) {
                    activeQuestion.classList.remove('active');
                    activeQuestion.nextElementSibling.classList.remove('show');
                }
            });

            // Toggle current question
            question.classList.toggle('active');
            answer.classList.toggle('show');
        });
    });


    // --- Scroll Animation Observer ---
    const scrollElements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Optional: Stop observing once visible
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    scrollElements.forEach(el => {
        observer.observe(el);
    });


    // --- Dynamic Fireflies in Hero Section ---
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        const firefliesContainer = document.createElement('div');
        firefliesContainer.className = 'fireflies';
        const numberOfFireflies = 25;

        for (let i = 0; i < numberOfFireflies; i++) {
            const firefly = document.createElement('div');
            firefly.className = 'firefly';
            
            const size = Math.random() * 3 + 1; // size between 1px and 4px
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 8 + 5; // duration between 5s and 13s
            const animationDelay = Math.random() * 5;

            firefly.style.width = `${size}px`;
            firefly.style.height = `${size}px`;
            firefly.style.top = `${top}%`;
            firefly.style.left = `${left}%`;
            firefly.style.animationDuration = `${animationDuration}s`;
            firefly.style.animationDelay = `${animationDelay}s`;
            
            firefliesContainer.appendChild(firefly);
        }
        heroSection.prepend(firefliesContainer); // Add fireflies behind the content
    }
});