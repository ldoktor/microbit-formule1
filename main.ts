function joy(): number[] {
    //  Read joystick input using joy_cal calibration
    
    return [Math.map(pins.analogReadPin(AnalogPin.P1), joy_cal[0], joy_cal[1], 0, 1024), Math.map(pins.analogReadPin(AnalogPin.P2), joy_cal[2], joy_cal[3], 0, 1024)]
}

function get_gear(): number {
    //  Get gear based on the calibrated joystick input
    let [x, y] = joy()
    if (y > 800) {
        if (x > 800) {
            return 1
        } else if (x < 550 && x > 350) {
            return 3
        } else if (x < 200) {
            return 5
        }
        
    } else if (y < 200) {
        if (x > 800) {
            return 2
        } else if (x < 550 && x > 350) {
            return 4
        } else if (x < 200) {
            return 6
        }
        
    }
    
    return 0
}

function shift(new_gear: number) {
    //  Avoid invalid gears
    if (new_gear > 6 || new_gear < 0) {
        return
    }
    
    //  Change the ratio, gear and adjust revs
    
    let old = ratio
    ratio = ratios[new_gear]
    if (ratio) {
        rev = old * rev / ratio
    }
    
    gear = new_gear
}

input.onButtonPressed(Button.B, function shift_up() {
    
    shift(gear + 1)
})
input.onButtonPressed(Button.AB, function shift_down() {
    
    shift(gear - 1)
})
//  Initialize environment
let exit = false
let distance = 0
let speed = 0
let gear = 0
//  rev 600 - 14000
let rev = 600
gear = 1
let ratio = 0
let ratios = [0, 0.00357, 0.00714, 0.0107, 0.0143, 0.0179, 0.0257]
music.setTempo(900)
//  Optional joystick gearbox
let joy_cal = [0, 1024, 0, 1024]
let use_joystick = false
basic.forever(function physics() {
    
    //  Exit conditions
    if (rev < 600) {
        rev = 600
    } else if (rev > 14000) {
        exit = true
        rev = 0
        basic.showString("Boom!")
        basic.showNumber(distance)
        basic.pause(1000)
        control.reset()
    }
    
    if (distance >= 25) {
        exit = true
        basic.showString("Finish!")
        basic.showNumber(control.millis() / 1000)
        basic.pause(1000)
        control.reset()
    }
    
    if (input.buttonIsPressed(Button.A)) {
        //  Acceleration
        if (rev < 2500) {
            rev = rev * 1.015
        }
        
        if (rev < 5000) {
            rev = rev * 1.016
        } else if (rev < 7500) {
            rev = rev * 1.018
        } else if (rev < 12000) {
            rev = rev * 1.021
        } else {
            rev = rev * 1.020
        }
        
    } else {
        //  Idling
        rev = rev * 0.99
    }
    
    speed = rev * ratio
    //  Wind
    rev = rev * Math.map(speed, 0, 400, 1, 0.981)
    distance = distance + 0.0001 * speed
    basic.pause(10)
})
// music.play_tone(rev / 10 + 150, music.beat(BeatFraction.WHOLE))
basic.forever(function engine_sound() {
    music.playTone(rev / 10, music.beat(BeatFraction.Whole))
    music.playTone(rev / 10 + 50, music.beat(BeatFraction.Whole))
})
basic.forever(function draw_hud() {
    let i: number;
    //  Keep drawing HUD until exit
    //  RPMs, speed, gear, circuit position, all laps
    
    if (exit) {
        return
    }
    
    basic.clearScreen()
    for (i = 0; i < rev / 14000 * 5; i++) {
        led.plot(0, i)
    }
    for (i = 0; i < speed / 400 * 5; i++) {
        led.plot(1, i)
    }
    for (i = 0; i < gear - 1; i++) {
        led.plot(2, i)
    }
    for (i = 0; i < distance % 5; i++) {
        led.plot(3, i)
    }
    for (i = 0; i < distance / 5; i++) {
        led.plot(4, i)
    }
})
basic.forever(function handle_joystick() {
    //  When P15 is set to low, start the 5s calibration
    //  then the joystick can be used as a gearshifter
    
    basic.pause(50)
    //  calibration
    if (!pins.digitalReadPin(DigitalPin.P15)) {
        exit = true
        basic.showString("C")
        joy_cal = [9999, 0, 9999, 0]
        for (let i = 0; i < 50; i++) {
            joy_cal[0] = Math.min(joy_cal[0], pins.analogReadPin(AnalogPin.P1))
            joy_cal[1] = Math.max(joy_cal[1], pins.analogReadPin(AnalogPin.P1))
            joy_cal[2] = Math.min(joy_cal[2], pins.analogReadPin(AnalogPin.P2))
            joy_cal[3] = Math.max(joy_cal[3], pins.analogReadPin(AnalogPin.P2))
            basic.pause(100)
        }
        basic.showString("O")
        exit = false
        use_joystick = true
    }
    
    //  skip the rest when joystick not calibrated
    if (!use_joystick) {
        return
    }
    
    //  only update gear when not on neutral
    let new_gear = get_gear()
    if (new_gear && gear != new_gear) {
        shift(new_gear)
    }
    
})
