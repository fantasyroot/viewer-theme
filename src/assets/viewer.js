
document.querySelectorAll('.ch-viewer__fullpage')[0].addEventListener('click', function() {
    if (!window.viewer) return;

    window.viewer.setScreen(true);
    setTimeout(function() {
         window.viewer.setAutoRotate(true);
    }, 1200);

});


