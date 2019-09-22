
document.querySelectorAll('.ch-viewer__fullpage')[0].addEventListener('click', function() {
    if (!window.viewer) return;

    window.viewer.setScreen(true);
    setTimeout(function() {
         window.viewer.setAutoRotate(true);
    }, 1200);

});

if (navigator.userAgent.indexOf('iPad') === -1 && navigator.userAgent.indexOf('Mobile') === -1) {
    var fullpageDom = document.getElementsByClassName('ch-viewer__fullpage')[0];
    if (fullpageDom) {
      var classVal = fullpageDom.getAttribute('class');
      classVal = classVal.concat(' pc');
      fullpageDom.setAttribute('class', classVal);
    }
}
