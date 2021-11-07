def on_button_pressed_b():
    global gear, ratio, ratios, rev
    if gear >= 6:
        return
    gear = gear + 1
    old = ratio
    ratio = ratios[gear]
    rev = old * rev / ratio
    basic.show_number(gear)
input.on_button_pressed(Button.B, on_button_pressed_b)

def on_button_pressed_ab():
    global gear, ratio, ratios, rev
    if gear <= 0:
        return
    gear = gear - 1
    old = ratio
    ratio = ratios[gear]
    rev = old * rev / ratio
    basic.show_number(gear)
input.on_button_pressed(Button.AB, on_button_pressed_ab)

exit = False
distance = 0
speed = 0
ratio = 0
ratios: List[number] = []
gear = 0
# rev 600 - 14000
rev = 600
gear = 1
ratios = [0, 0.00357, 0.00714, 0.0107, 0.0143, 0.0179, 0.0257]
music.set_tempo(900)
#music.change_tempo_by(1000)

def on_forever():
    global rev, speed, distance, gear, ratio, exit
    #serial.write_value("rev", rev)
    #serial.write_value("speed", speed)
    #serial.write_value("distance", distance)
    #serial.write_value("gear", gear)
    # led.plot_bar_graph(rev, 14000)
    if rev < 600:
        rev = 600
    elif rev > 14000:
        exit = True
        rev = 0
        basic.show_string("Boom!")
        basic.show_number(distance)
        basic.pause(1000)
        control.reset()
    elif distance >= 25:
        exit = True
        basic.show_string("Finish!")
        basic.show_number(control.millis() / 1000)
        basic.pause(1000)
        control.reset()
    if input.button_is_pressed(Button.A):
        if rev < 2500:
            rev = rev * 1.015
        if rev < 5000:
            rev = rev * 1.016
        elif rev < 7500:
            rev = rev * 1.018
        elif rev < 12000:
            rev = rev * 1.021
        else:
            rev = rev * 1.020
    else:
        rev = rev * 0.99
    speed = rev * ratio
    # wind
    rev = rev * Math.map(speed, 0, 400, 1, 0.981)
    distance = distance + 0.0001 * speed
    basic.pause(10)
basic.forever(on_forever)

def on_forever2():
    music.play_tone(rev / 10, music.beat(BeatFraction.WHOLE))
    music.play_tone(rev / 10 + 50, music.beat(BeatFraction.WHOLE))
    music.play_tone(rev / 10 + 150, music.beat(BeatFraction.WHOLE))
basic.forever(on_forever2)

def on_forever3():
    global exit
    if exit:
        return
    basic.clear_screen()
    for i in range(rev / 14000 * 5):
        led.plot(0, i)
    for i in range(speed / 400 * 5):
        led.plot(1, i)
    for i in range(gear - 1):
        led.plot(2, i)
    for i in range(distance % 5):
        led.plot(3, i)
    for i in range((distance / 5)):
        led.plot(4, i)
basic.forever(on_forever3)