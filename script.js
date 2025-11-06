window.onload = function() {
    // Add a small delay to prevent the loader from just flashing
    // on fast connections. 500ms = half a second.
    setTimeout(function() {
        document.body.classList.add('loaded');
    }, 500); 
};
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Mobile Navigation (Your advanced version) ---
    // This is your better version with the icon swap and close-on-click.
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

    // --- 2. "Join Now" Button Functionality (FIXED) ---
    // This now correctly targets the button on the Firefly game card (.firefly-join)
    // instead of the main hero button (.cta-button).
    const fireflyJoinButton = document.querySelector('.firefly-join'); 
    const platformSelection = document.getElementById('platform-selection');

    if (fireflyJoinButton && platformSelection) {
        fireflyJoinButton.addEventListener('click', () => {
            platformSelection.classList.remove('hidden');
            // Smoothly scroll to the platform selection section
            platformSelection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // --- 3. FAQ Accordion (Your version) ---
    // This is your version that correctly uses the .show class from your CSS.
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

    // --- 4. Scroll Animation Observer (Your version) ---
    // This is your version that correctly uses the .is-visible class from your CSS.
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

    // --- 5. Dynamic Fireflies in Hero Section (Your new feature) ---
    // This is your new feature, it's perfect.
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
const swup = new Swup();

// === 2. Create a function to run all our JS ===
// We need to run this on the *first* load, and
// every time swup brings in a new page.
function initPage() {

    // --- Mobile Navigation ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                // Don't close if it's not a hash link (e.g. /firefly/windows)
                // Swup will handle the page transition
                if (link.getAttribute('href').startsWith('#') && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    const icon = menuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // --- "Join Now" Button Functionality ---
    const fireflyJoinButton = document.querySelector('.firefly-join'); 
    const platformSelection = document.getElementById('platform-selection');

    if (fireflyJoinButton && platformSelection) {
        fireflyJoinButton.addEventListener('click', () => {
            platformSelection.classList.remove('hidden');
            platformSelection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // --- FAQ Accordion ---
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            document.querySelectorAll('.faq-question.active').forEach(activeQuestion => {
                if (activeQuestion !== question) {
                    activeQuestion.classList.remove('active');
                    activeQuestion.nextElementSibling.classList.remove('show');
                }
            });
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
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    scrollElements.forEach(el => {
        observer.observe(el);
    });

    // --- Hero Text Staggered Animation ---
    if (document.querySelector('.hero-section')) {
        const loader = document.getElementById('loader-wrapper');
        if (!loader) { 
            document.body.classList.add('loaded');
        }
    }

    // --- NEW: Android Page Tab Logic ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const methodContents = document.querySelectorAll('.method-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            
            // Update buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update content
            methodContents.forEach(content => {
                if (content.id === targetId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // --- NEW: Copy to Clipboard Logic ---
    const copyButtons = document.querySelectorAll('.copy-button');

    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            input.select();
            input.setSelectionRange(0, 99999); // For mobile
            
            try {
                // Use execCommand as a fallback for iFrame compatibility
                document.execCommand('copy');
                
                // Visual feedback
                const icon = button.querySelector('i');
                icon.classList.remove('fa-copy');
                icon.classList.add('fa-check');
                
                setTimeout(() => {
                    icon.classList.remove('fa-check');
                    icon.classList.add('fa-copy');
                }, 1500);

            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    });

}

// === 3. Run our functions ===

// Run it on the first page load
initPage();

// Run it every time swup loads a new page
swup.on('contentReplaced', initPage);