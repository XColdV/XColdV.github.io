document.addEventListener('DOMContentLoaded', () => {
    const backLink = document.querySelector('.back-link');

    backLink.addEventListener('click', (event) => {
        // Prevent the browser from navigating instantly
        event.preventDefault();

        const destination = backLink.href; // Get the URL to go to

        // Add a fade-out class to the body
        document.body.classList.add('fade-out');

        // Wait for the animation to finish, then navigate
        setTimeout(() => {
            window.location.href = destination;
        }, 500); // This duration should match the CSS transition time
    });
});