function simulateControllerFeedback() {

    AppState.controller.rxAzimuth =
        AppState.tracker.currentAzimuth;

    AppState.controller.rxElevation =
        AppState.tracker.currentElevation;

    AppState.controller.lastUpdate =
        Date.now();
}

function sendToController() {

    AppState.controller.txAzimuth =
        AppState.tracker.targetAzimuth;

    AppState.controller.txElevation =
        AppState.tracker.targetElevation;

    AppState.controller.lastUpdate =
        Date.now();
}

async function sendTrackerCommand() {

    if (!isTargetReachable()) {

        if (!targetOutOfRange) {

            console.log(
                'Target outside antenna limits'
            );

            targetOutOfRange = true;
        }

            return;
        }

    targetOutOfRange = false;

    try {

        await fetch(
            'http://localhost:8000/api/v1/tracker',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    azimuth:
                        AppState.tracker.targetAzimuth,

                    elevation:
                        AppState.tracker.targetElevation
                })
            }
        );

    } catch(error) {

        console.error(error);
    }
}

async function getTrackerStatus() {
    try {

        const response = await fetch(
            'http://localhost:8000/api/v1/tracker/status'
        );

        const data = await response.json();

        AppState.tracker.currentAzimuth =
            data.current_azimuth;

        AppState.tracker.currentElevation =
            data.current_elevation;

        console.log(AppState.tracker);

        AppState.tracker.targetAzimuth =
            data.target_azimuth;

        AppState.tracker.targetElevation =
            data.target_elevation;

    } catch(error) {

        console.error(error);
    }
}

function getAngleError(a, b) {

    let diff = Math.abs(a - b);

    if (diff > 180) {
        diff = 360 - diff;
    }

    return diff;
}

function isTargetReachable() {

   const azOk =
    AppState.tracker.targetAzimuth >=
        AppState.antenna.azimuthMin &&

    AppState.tracker.targetAzimuth <=
        AppState.antenna.azimuthMax;

const elOk =
    AppState.tracker.targetElevation >=
        AppState.antenna.elevationMin &&

    AppState.tracker.targetElevation <=
        AppState.antenna.elevationMax;

    return azOk && elOk;
}

function isNearLimit() {

    const warningZone = 10;

    return (
        AppState.tracker.targetAzimuth <=
            AppState.antenna.azimuthMin + warningZone ||

        AppState.tracker.targetAzimuth >=
            AppState.antenna.azimuthMax - warningZone
);
}