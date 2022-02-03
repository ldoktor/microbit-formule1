def joy():
    # Read joystick input using joy_cal calibration
    global joy_cal
    return Math.map(pins.analog_read_pin(AnalogPin.P1), joy_cal[0], joy_cal[1], 0, 1024), Math.map(pins.analog_read_pin(AnalogPin.P2), joy_cal[2], joy_cal[3], 0, 1024)

def get_gear():
    # Get gear based on the calibrated joystick input
    x, y = joy()
    if y > 800:
        if x > 800:
            return 1
        elif x < 550 and x > 350:
            return 3
        elif x < 200:
            return 5
    elif y < 200:
        if x > 800:
            return 2
        elif x < 550 and x > 350:
            return 4
        elif x < 200:
            return 6
    return 0


def shift(new_gear):
    # Avoid invalid gears
    if new_gear > 6 or new_gear < 0:
        return
    # Change the ratio, gear and adjust revs
    global gear, ratio, ratios, rev
    old = ratio
    ratio = ratios[new_gear]
    if ratio:
        rev = old * rev / ratio
    gear = new_gear

def shift_up():
    global gear
    shift(gear + 1)
input.on_button_pressed(Button.B, shift_up)

def shift_down():
    global gear
    shift(gear - 1)
input.on_button_pressed(Button.AB, shift_down)

# Initialize environment
exit = False
distance = 0
speed = 0
gear = 0
# rev 600 - 14000
rev = 600
gear = 1
ratio = 0
ratios: List[number] = [0, 0.00357, 0.00714, 0.0107, 0.0143, 0.0179, 0.0257]
music.set_tempo(900)
# Optional joystick gearbox
joy_cal = [0, 1024, 0, 1024]
use_joystick = False

def physics():
    global rev, speed, distance, gear, ratio, exit
    # Exit conditions
    if rev < 600:
        rev = 600
    elif rev > 14000:
        exit = True
        rev = 0
        basic.show_string("Boom!")
        basic.show_number(distance)
        basic.pause(1000)
        control.reset()
    if distance >= 25:
        exit = True
        basic.show_string("Finish!")
        basic.show_number(control.millis() / 1000)
        basic.pause(1000)
        control.reset()
    if input.button_is_pressed(Button.A):
        # Acceleration
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
        # Idling
        rev = rev * 0.99
    speed = rev * ratio
    # Wind
    rev = rev * Math.map(speed, 0, 400, 1, 0.981)
    distance = distance + 0.0001 * speed
    basic.pause(10)
basic.forever(physics)

def engine_sound():
    music.play_tone(rev / 10, music.beat(BeatFraction.WHOLE))
    music.play_tone(rev / 10 + 50, music.beat(BeatFraction.WHOLE))
    #music.play_tone(rev / 10 + 150, music.beat(BeatFraction.WHOLE))
basic.forever(engine_sound)

def draw_hud():
    # Keep drawing HUD until exit
    # RPMs, speed, gear, circuit position, all laps
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
basic.forever(draw_hud)

def handle_joystick():
    # When P15 is set to low, start the 5s calibration
    # then the joystick can be used as a gearshifter
    global joy_cal, use_joystick, exit
    basic.pause(50)
    # calibration
    if not pins.digital_read_pin(DigitalPin.P15):
        exit = True
        basic.show_string("C")
        joy_cal = [9999, 0, 9999, 0]
        for i in range(50):
            joy_cal[0] = min(joy_cal[0], pins.analog_read_pin(AnalogPin.P1))
            joy_cal[1] = max(joy_cal[1], pins.analog_read_pin(AnalogPin.P1))
            joy_cal[2] = min(joy_cal[2], pins.analog_read_pin(AnalogPin.P2))
            joy_cal[3] = max(joy_cal[3], pins.analog_read_pin(AnalogPin.P2))
            basic.pause(100)
        basic.show_string("O")
        exit = False
        use_joystick = True
    # skip the rest when joystick not calibrated
    if not use_joystick:
        return
    # only update gear when not on neutral
    new_gear = get_gear()
    if new_gear and gear != new_gear:
        shift(new_gear)

#basic.forever(handle_joystick)