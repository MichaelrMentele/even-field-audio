window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})

var contextClass = (window.AudioContext ||
  window.webkitAudioContext)

// Web Audio API is available.
var context = new contextClass();

  // Create a filter
var filter = context.createBiquadFilter();
// Note: the Web Audio spec is moving from constants to strings.
// filter.type = 'lowpass';
filter.type = 'highpass';
filter.frequency.value = 100;
filter.connect(context.destination)

  // Create some sweet sweet nodes.
  var oscillator = context.createOscillator();
  oscillator.connect(filter);
  // Play a sine type curve at A4 frequency (440hz).
  oscillator.frequency.value = 440;

  // Note: this constant will be replaced with "sine".
  oscillator.type = oscillator.SINE;
  oscillator.start(0);


