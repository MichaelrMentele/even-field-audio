var Tone = require("Tone");
var $ = require("jquery");


function PhaseShiftAllpass() {
        input = new Tone.Gain({ context: Tone.context });
        /**
         * The phase shifted output
         */
        output = new Tone.Gain({ context: Tone.context });
        /**
         * The PhaseShifted allpass output
         */
        offset90 = new Tone.Gain({ context: Tone.context });
        const allpassBank1Values = [0.6923878, 0.9360654322959, 0.9882295226860, 0.9987488452737];
        const allpassBank2Values = [0.4021921162426, 0.8561710882420, 0.9722909545651, 0.9952884791278];
        _bank0 = _createAllPassFilterBank(allpassBank1Values);
        _bank1 = _createAllPassFilterBank(allpassBank2Values);
        _oneSampleDelay = Tone.context.createIIRFilter([0.0, 1.0], [1.0, 0.0]);
        // connect Allpass filter banks
        Tone.connectSeries(input, ..._bank0, _oneSampleDelay, output);
        Tone.connectSeries(input, ..._bank1, offset90);
        return output
    }
    /**
     * Create all of the IIR filters from an array of values using the coefficient calculation.
     */
    function _createAllPassFilterBank(bankValues) {
        const nodes = bankValues.map(value => {
            const coefficients = [[value * value, 0, -1], [1, 0, -(value * value)]];
            return Tone.context.createIIRFilter(coefficients[0], coefficients[1]);
        });
        return nodes;
    }

$.when($.ready).then(function() {
    // elements
    const urlTextarea = document.getElementById('url');
    // const useToneButton = document.getElementById('use-tone')
    // const loadButton = document.getElementById('load');
    const stopButton = document.getElementById('stop');
    const monoButton = document.getElementById('mono');
    const stereoButton = document.getElementById('stereo');
    const twoEarsInOne = document.getElementById('2e1')
    const unilateralStereoButton = document.getElementById('unilateral-stereo');

    let player;
    function getPlayer() {
        console.log(urlTextarea.value)
        player = new Tone.Player(urlTextarea.value, () => {
            Tone.Transport.start();
        })
        player.autostart=true
        return player
    }

    /**
     * Stops the audio source when clicked.
     */
    stopButton.addEventListener('click', () => {
        player.stop()
    });

    /**
     * Keeps normal stereo output
     */
    stereoButton.addEventListener('click', () => {
        getPlayer()
        player.toDestination();
    })
    
    /**
     * Mixes L/R into one channel
     */
    monoButton.addEventListener('click', () => {
        console.log('mono')

        getPlayer()

        const mono = new Tone.Mono().toDestination()
        player.connect(mono)
    })
    
    twoEarsInOne.addEventListener('click', () => {
        const source = getPlayer()

        const panner = new Tone.Panner3D(3, 1, 1)
        source.connect(panner)
   
        // Contrast right channel
        const split = new Tone.Split()
        panner.connect(split)

        // 2E1 just has offset drivers in the ear cup, so add delay to one driver
        const delay = new Tone.Delay(0.000035)
        
        split.connect(delay, 0)

        const merge = new Tone.Merge()
        split.connect(merge, 1, 0)
        delay.connect(merge, 0, 0)
        
        merge.toDestination()
        
        let increment = 0.1;
        Tone.Transport.scheduleRepeat((time) => {
            // use the callback time to schedule events
            if (panner.positionX.value > 5) { increment = -0.1 }
            else if (panner.positionX.value < -5) { increment = 0.1}
            
            panner.positionX.value += increment
            console.log(panner.positionX.value)
        }, 0.2);
    })

    /**
     * Secret sauce for stereo in one ear: center symmetrical where contrast is in the middle
     */
    unilateralStereoButton.addEventListener('click', () => {
        const source = getPlayer()
        const [start, end] = channelSubtraction()
        console.log(start)
        console.log(end)

        panner = getPannerScenarios()
        source.connect(panner) // connect to panner
        panner.connect(start)
        end.toDestination()
    })

    function channelSubtraction() {
        const split = new Tone.Split();
        const sub = new Tone.Subtract();
        const unitGain = new Tone.Gain();

        split.connect(sub, 0) // left
        split.connect(sub.subtrahend, 1) // right
        return [split, sub]
    }

    /*
     * The idea here is that we can have the same sound present on the left and right channels such that they
     * cancel each other out and then have a constant left vs. right indicator.
     */
    function symmetricContrast() {

        console.log('symcon')
        // Contrast right channel
        const split = new Tone.Split()

        // setup right contrast
        // This should be dynamic since different freq. travel thru the head at different speeds
        // micro seconds
        const rightUpShift = new Tone.FrequencyShifter(42)
        split.connect(rightUpShift, 1)
        const rightPitchShift = new Tone.PitchShift(6)
        rightUpShift.chain(rightPitchShift)

        // setup left contrast
        const leftDownShift = new Tone.FrequencyShifter(0)
        split.connect(leftDownShift, 0)
        const leftPitchShift = new Tone.PitchShift(0)
        leftDownShift.chain(leftPitchShift)
    
        const merge = new Tone.Merge()
        leftPitchShift.connect(merge, 0, 0)
        rightPitchShift.connect(merge, 0, 0)
        
        return [split, merge]
    }

    function singleSidedContrast() {        
        // Contrast right channel
        const split = new Tone.Split()
        
        // This should be dynamic since different freq. travel thru the head at different speeds
        // micro seconds
        const delay = new Tone.Delay(0.000020)
        
        const shift = new Tone.FrequencyShifter(42)
        split.connect(delay, 0)
        delay.connect(shift)
        
        const pitchShift = new Tone.PitchShift(0)
        shift.connect(pitchShift)
    
        const merge = new Tone.Merge()
        split.connect(merge, 1, 0)
        pitchShift.connect(merge, 0, 0)

        return [split, merge]
    }

    function getPannerScenarios() {
        const panner = new Tone.Panner3D(0, 0, 0)

        // Case 1: Pan the audio left and right
        let increment = 0.1;
        let startTime;
        let enter_y = false;
        let enter_z = false;
        Tone.Transport.scheduleRepeat((time) => {
            if (startTime === undefined) startTime = time
            const X_PAN_END_TIME= startTime + 20
            const Y_PAN_END_TIME = X_PAN_END_TIME + 20
            const Z_PAN_END_TIME = Y_PAN_END_TIME + 20

            if (time < X_PAN_END_TIME) {
                // Case 1.1 pan left and right
                if (panner.positionX.value > 5) { increment = -0.1 }
                else if (panner.positionX.value < -5) { increment = 0.1}
                panner.positionX.value += increment

            } else if (time < Y_PAN_END_TIME) {
                if (enter_y === false) {
                    panner.setPosition(0,0,0)
                    enter_y = true
                }
                // Case 1.2: Pan the audio up and down
                if (panner.positionY.value > 5) { increment = -0.1 }
                else if (panner.positionY.value < -5) { increment = 0.1}
                panner.positionY.value += increment

            } else if (time < Z_PAN_END_TIME) {
                if (enter_z === false) {
                    panner.setPosition(0,0,0)
                    enter_z = true
                }
                 // Case 1.3: Pan the audio forward and back
                if (panner.positionZ.value > 5) { increment = -0.1 }
                else if (panner.positionZ.value < -5) { increment = 0.1}
                panner.positionZ.value += increment
            }
            console.log(`x: ${panner.positionX.value} y: ${panner.positionY.value} z: ${panner.positionZ.value}`)
        }, 0.1);

        return panner;

    
        // Case 4: Pan the audio at a fixed distance in front left and right
        // Case 4: Random 3D pan
    }
})

