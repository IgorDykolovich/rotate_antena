const controllerState = {

    connected: true,

    txAzimuth: 0,
    txElevation: 0,

    rxAzimuth: 0,
    rxElevation: 0,

    lastUpdate: Date.now()
};


function simulateControllerFeedback() {

    controllerState.rxAzimuth =
        antennaState.currentAzimuth;

    controllerState.rxElevation =
        antennaState.currentElevation;

    controllerState.lastUpdate =
        Date.now();
}

function sendToController() {

    controllerState.txAzimuth =
        antennaState.targetAzimuth;

    controllerState.txElevation =
        antennaState.targetElevation;

    controllerState.lastUpdate =
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
                        antennaState.targetAzimuth,

                    elevation:
                        antennaState.targetElevation
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

        antennaState.currentAzimuth =
            data.current_azimuth;

        antennaState.currentElevation =
            data.current_elevation;

        antennaState.targetAzimuth =
            data.target_azimuth;

        antennaState.targetElevation =
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
        antennaState.targetAzimuth >=
            antennaState.azimuthMin &&

        antennaState.targetAzimuth <=
            antennaState.azimuthMax;

    const elOk =
        antennaState.targetElevation >=
            antennaState.elevationMin &&

        antennaState.targetElevation <=
            antennaState.elevationMax;

    return azOk && elOk;
}

function isNearLimit() {

    const warningZone = 10;

    return (
        antennaState.targetAzimuth <=
            antennaState.azimuthMin + warningZone ||

        antennaState.targetAzimuth >=
            antennaState.azimuthMax - warningZone
    );
}