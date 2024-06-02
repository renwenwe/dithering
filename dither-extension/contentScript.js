document.addEventListener('dragstart', (event) => {
    if (event.target.tagName === 'IMG') {
        event.dataTransfer.setData('text/plain', event.target.src);
    }
});
