def telemetry_message(data):

    return {

        "type": "telemetry",

        "data": data
    }


def tracker_message(data):

    return {

        "type": "tracker",

        "data": data
    }


def log_message(level, text):

    return {

        "type": "log",

        "data": {

            "level": level,

            "text": text
        }
    }