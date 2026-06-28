function updateTelemetryUI() {

    document.getElementById('droneLat').innerText =
        `LAT: ${dronePosition.lat.toFixed(6)}`;

    document.getElementById('droneLon').innerText =
        `LON: ${dronePosition.lon.toFixed(6)}`;

    document.getElementById('droneAlt').innerText =
        `ALT: ${dronePosition.altitude}m`;

    document.getElementById('homeLat').innerText =
        `LAT: ${homePosition.lat.toFixed(6)}`;

    document.getElementById('homeLon').innerText =
        `LON: ${homePosition.lon.toFixed(6)}`;

    document.getElementById('homeHeight').innerText =
        `HEIGHT: ${homePosition.height}m`;
        const trackingError = getAngleError(
            antennaState.targetAzimuth,
            antennaState.currentAzimuth
    );

    document.getElementById('trackingError').innerText =
        `Tracking Error: ${trackingError.toFixed(1)}°`;
        document.getElementById('currentAzimuth').innerText =
    `Current AZ: ${antennaState.currentAzimuth.toFixed(1)}°`;

    document.getElementById('targetAzimuth').innerText =
        `Target AZ: ${antennaState.targetAzimuth.toFixed(1)}°`;

    document.getElementById('currentElevation').innerText =
        `Current EL: ${antennaState.currentElevation.toFixed(1)}°`;

    document.getElementById('targetElevation').innerText =
        `Target EL: ${antennaState.targetElevation.toFixed(1)}°`;
    const azError = getAngleError(
        antennaState.targetAzimuth,
        antennaState.currentAzimuth
    );

    const elError = Math.abs(
        antennaState.targetElevation -
        antennaState.currentElevation
    );

    document.getElementById('azimuthError').innerText =
        `AZ Error: ${azError.toFixed(1)}°`;

    document.getElementById('elevationError').innerText =
        `EL Error: ${elError.toFixed(1)}°`;

    let state = 'IDLE';

   if (!isTargetReachable()) {

        state = 'OUT OF RANGE';
    }
    else if (isNearLimit()) {

        state = 'NEAR LIMIT';
    }
    else if (azError > 5) {

        state = 'TRACKING';
    }
    else if (azError > 1) {

        state = 'ALIGNING';
    }
    else {

        state = 'LOCKED';
    }

    const stateElement =
    document.getElementById(
        'antennaState'
    );

    stateElement.innerText =
        `State: ${state}`;

    stateElement.className = '';

    switch (state) {

    case 'LOCKED':
        stateElement.classList.add(
            'state-locked'
        );
        break;

    case 'ALIGNING':
        stateElement.classList.add(
            'state-aligning'
        );
        break;

    case 'TRACKING':
        stateElement.classList.add(
            'state-tracking'
        );
        break;

    case 'NEAR LIMIT':
        stateElement.classList.add(
            'state-near-limit'
        );
        break;

    case 'OUT OF RANGE':
        stateElement.classList.add(
            'state-out-of-range'
        );
        break;

    default:
        stateElement.classList.add(
            'state-idle'
        );
}
    document.getElementById('txAzimuth').innerText =
    `TX AZ: ${controllerState.txAzimuth.toFixed(1)}°`;

    document.getElementById('txElevation').innerText =
        `TX EL: ${controllerState.txElevation.toFixed(1)}°`;

    document.getElementById('rxAzimuth').innerText =
        `RX AZ: ${controllerState.rxAzimuth.toFixed(1)}°`;

    document.getElementById('rxElevation').innerText =
        `RX EL: ${controllerState.rxElevation.toFixed(1)}°`;  
        
    document.getElementById('azimuthLimits').innerText =
        `AZ Limits: ${antennaState.azimuthMin}° - ${antennaState.azimuthMax}°`;

    document.getElementById('elevationLimits').innerText =
        `EL Limits: ${antennaState.elevationMin}° - ${antennaState.elevationMax}°`;
    
        const margin = Math.min(
        Math.abs(
            antennaState.targetAzimuth -
            antennaState.azimuthMin
        ),
        Math.abs(
            antennaState.azimuthMax -
            antennaState.targetAzimuth
        )
    );

    document.getElementById('limitMargin').innerText =
        `Margin: ${margin.toFixed(1)}°`;
}

function updateCompass() {
    if (
        antennaState.currentAzimuth === undefined ||
        antennaState.targetAzimuth === undefined
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
            ${antennaState.currentAzimuth}
            110
            110
        )`
    );

    target.setAttribute(
        'transform',
        `rotate(
            ${antennaState.targetAzimuth}
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
                homePosition.lat,
                homePosition.lon
            ]);

            bounds.extend([
                dronePosition.lat,
                dronePosition.lon
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