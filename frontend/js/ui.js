function updateHomePanel() {

    document.getElementById('homeLat').innerText =
        `LAT: ${AppState.home.lat.toFixed(6)}`;

    document.getElementById('homeLon').innerText =
        `LON: ${AppState.home.lon.toFixed(6)}`;

    document.getElementById('homeHeight').innerText =
        `HEIGHT: ${AppState.home.height}m`;

}

function updateDronePanel() {

    document.getElementById('droneLat').innerText =
        `LAT: ${AppState.telemetry.position.lat.toFixed(6)}`;

    document.getElementById('droneLon').innerText =
        `LON: ${AppState.telemetry.position.lon.toFixed(6)}`;

    document.getElementById('droneAlt').innerText =
        `ALT: ${AppState.telemetry.position.altitude}m`;

}

function calculateTrackingErrors() {

    const trackingError = getAngleError(
        AppState.tracker.targetAzimuth,
        AppState.tracker.currentAzimuth
        );

    const azimuthError = trackingError;

    const elevationError = Math.abs(
        AppState.tracker.targetElevation -
        AppState.tracker.currentElevation
    );

    return {
        trackingError,
        azimuthError,
        elevationError
    };
}

function updateTrackerPanel() {

    const {
        trackingError,
        azimuthError,
        elevationError
    } = calculateTrackingErrors();

    document.getElementById('trackingError').innerText =
        `Tracking Error: ${trackingError.toFixed(1)}°`;

    document.getElementById('currentAzimuth').innerText =
        `Current AZ: ${AppState.tracker.currentAzimuth.toFixed(1)}°`;

    document.getElementById('targetAzimuth').innerText =
        `Target AZ: ${AppState.tracker.targetAzimuth.toFixed(1)}°`;

    document.getElementById('currentElevation').innerText =
        `Current EL: ${AppState.tracker.currentElevation.toFixed(1)}°`;

    document.getElementById('targetElevation').innerText =
        `Target EL: ${AppState.tracker.targetElevation.toFixed(1)}°`;

    document.getElementById('azimuthError').innerText =
        `AZ Error: ${azimuthError.toFixed(1)}°`;

    document.getElementById('elevationError').innerText =
        `EL Error: ${elevationError.toFixed(1)}°`;
}

function updateAntennaStatePanel() {

    const {
        azimuthError
    } = calculateTrackingErrors();

    let state = 'IDLE';

    if (!isTargetReachable()) {

        state = 'OUT OF RANGE';

    } else if (isNearLimit()) {

        state = 'NEAR LIMIT';

    } else if (azimuthError > 5) {

        state = 'TRACKING';

    } else if (azimuthError > 1) {

        state = 'ALIGNING';

    } else {

        state = 'LOCKED';

    }

    const stateElement =
        document.getElementById('antennaState');

    stateElement.innerText =
        `State: ${state}`;

    stateElement.className = '';

    switch (state) {

        case 'LOCKED':
            stateElement.classList.add('state-locked');
            break;

        case 'ALIGNING':
            stateElement.classList.add('state-aligning');
            break;

        case 'TRACKING':
            stateElement.classList.add('state-tracking');
            break;

        case 'NEAR LIMIT':
            stateElement.classList.add('state-near-limit');
            break;

        case 'OUT OF RANGE':
            stateElement.classList.add('state-out-of-range');
            break;

        default:
            stateElement.classList.add('state-idle');
    }
}

function updateControllerPanel() {

    document.getElementById('txAzimuth').innerText =
        `TX AZ: ${AppState.controller.txAzimuth.toFixed(1)}°`;

    document.getElementById('txElevation').innerText =
        `TX EL: ${AppState.controller.txElevation.toFixed(1)}°`;

    document.getElementById('rxAzimuth').innerText =
        `RX AZ: ${AppState.controller.rxAzimuth.toFixed(1)}°`;

    document.getElementById('rxElevation').innerText =
        `RX EL: ${AppState.controller.rxElevation.toFixed(1)}°`;
}

function updateLimitsPanel() {

    document.getElementById('azimuthLimits').innerText =
        `AZ Limits: ${AppState.antenna.azimuthMin}° - ${AppState.antenna.azimuthMax}°`;

    document.getElementById('elevationLimits').innerText =
        `EL Limits: ${AppState.antenna.elevationMin}° - ${AppState.antenna.elevationMax}°`;

    const margin = Math.min(
        Math.abs(
            AppState.tracker.targetAzimuth -
            AppState.antenna.azimuthMin
        ),
        Math.abs(
            AppState.antenna.azimuthMax -
            AppState.tracker.targetAzimuth
        )
    );

    document.getElementById('limitMargin').innerText =
        `Margin: ${margin.toFixed(1)}°`;
}
function updateTelemetryUI() {

    updateHomePanel()

    updateDronePanel()

    updateTrackerPanel()

    updateAntennaStatePanel()

    updateLimitsPanel()

    updateControllerPanel()
}

function updateCompass() {
    if (
        AppState.tracker.currentAzimuth === undefined ||
        AppState.tracker.targetAzimuth === undefined
    ) {
        return;
    }

    const current =
        document.getElementById(
            'currentNeedle'
        );

    const target =
        document.getElementById(
            'targetNeedle'
        );

    if (!current || !target) return;

    current.setAttribute(
        'transform',
        `rotate(
            ${AppState.tracker.currentAzimuth}
            110
            110
        )`
    );

    target.setAttribute(
        'transform',
        `rotate(
            ${AppState.tracker.targetAzimuth}
            110
            110
        )`
    );
}

function setupFollowButton() {

    const button =
        document.getElementById(
            'followButton'
        );

    button.addEventListener(
        'click',
        () => {

            followDrone =
                !followDrone;

            button.innerText =
                followDrone
                ? 'FOLLOW: ON'
                : 'FOLLOW: OFF';
        }
    );
}

function setupAutoViewButton() {

    const button =
        document.getElementById(
            'autoViewButton'
        );

    button.addEventListener(
        'click',
        () => {

           const bounds = L.latLngBounds(
            flightTrail
        );

            bounds.extend([
                AppState.home.lat,
                AppState.home.lon
            ]);

            bounds.extend([
                AppState.telemetry.position.lat,
                AppState.telemetry.position.lon
            ]);

            map.fitBounds(
                bounds,
                {
                    padding: [50, 50]
                }
            );
        }
    );
}