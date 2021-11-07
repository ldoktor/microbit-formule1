input.onButtonPressed(Button.B, function on_button_pressed_b() {
    
    if (gear >= 6) {
        return
    }
    
    gear = gear + 1
    let old = ratio
    ratio = ratios[gear]
    rev = old * rev / ratio
    basic.showNumber(gear)
})
input.onButtonPressed(Button.AB, function on_button_pressed_ab() {
    
    if (gear <= 0) {
        return
    }
    
    gear = gear - 1
    let old = ratio
    ratio = ratios[gear]
    rev = old * rev / ratio
    basic.showNumber(gear)
})
let exit = false
let distance = 0
let speed = 0
let ratio = 0
let ratios : number[] = []
let gear = 0
//  rev 600 - 14000
let rev = 600
gear = 1
ratios = [0, 0.00357, 0.00714, 0.0107, 0.0143, 0.0179, 0.0257]
music.setTempo(900)
// music.change_tempo_by(1000)
basic.forever(function on_forever() {
    
    // serial.write_value("rev", rev)
    // serial.write_value("speed", speed)
    // serial.write_value("distance", distance)
    // serial.write_value("gear", gear)
    //  led.plot_bar_graph(rev, 14000)
    if (rev < 600) {
        rev = 600
    } else if (rev > 14000) {
        exit = true
        rev = 0
        basic.showString("Boom!")
        basic.showNumber(distance)
        basic.pause(1000)
        control.reset()
    } else if (distance >= 25) {
        exit = true
        basic.showString("Finish!")
        basic.showNumber(control.millis() / 1000)
        basic.pause(1000)
        control.reset()
    }
    
    if (input.buttonIsPressed(Button.A)) {
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
        rev = rev * 0.99
    }
    
    speed = rev * ratio
    //  wind
    rev = rev * Math.map(speed, 0, 400, 1, 0.981)
    distance = distance + 0.0001 * speed
    basic.pause(10)
})
basic.forever(function on_forever2() {
    music.playTone(rev / 10, music.beat(BeatFraction.Whole))
    music.playTone(rev / 10 + 50, music.beat(BeatFraction.Whole))
    music.playTone(rev / 10 + 150, music.beat(BeatFraction.Whole))
})
basic.forever(function on_forever3() {
    let i: number;
    
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
