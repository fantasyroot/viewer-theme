(function(lucy) {
    if (!lucy) {
        console.warn(
            '"window.lucy" does not exist. Please ensure you\'ve added the <script> to your theme'
        );
        return;
    }
    window.viewer = new lucy.ViewerSDK({
        mount: document.getElementById('lucy-viewer'),
        modelId: '3FO4KN5SBXP9',
    });
    window.viewer.start();
})(window.lucy);


document.querySelectorAll('.ch-viewer__fullpage')[0].addEventListener('click', function() {
    window.viewer.setScreen(true);
});


