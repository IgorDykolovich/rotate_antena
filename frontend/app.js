function updateAntennaTracking() {

    let azDiff =
    antennaState.targetAzimuth -
    antennaState.currentAzimuth;

    if (azDiff > 180) azDiff -= 360;
    if (azDiff < -180) azDiff += 360;
    if (Math.abs(azDiff) >
        antennaState.rotationSpeed) {

        antennaState.currentAzimuth +=
            Math.sign(azDiff) *
            antennaState.rotationSpeed;
    }
    else {

        antennaState.currentAzimuth =
            antennaState.targetAzimuth;
    }
    const elDiff =
    antennaState.targetElevation -
    antennaState.currentElevation;

    if (
        Math.abs(elDiff) >
        antennaState.rotationSpeed
    ) {
        antennaState.currentElevation +=
            Math.sign(elDiff) *
            antennaState.rotationSpeed;
    }
    else {
        antennaState.currentElevation =
            antennaState.targetElevation;
    }
    antennaState.currentAzimuth =
    (antennaState.currentAzimuth + 360) % 360;
}

async function initialize() {

    createMarkers();

    setupFollowButton();

    setupAutoViewButton();

    flightTrail.push([
        dronePosition.lat,
        dronePosition.lon
    ]);

    await calculate();

    updateBeam();
    updateTargetLine();
    updateCoverageSector();
    updateCompass();
    
}

document.addEventListener('keydown', (e) => {

    if (e.key === 'ArrowLeft') {

        dronePosition.heading -= 5;
    }

    if (e.key === 'ArrowRight') {

        dronePosition.heading += 5;
    }

    dronePosition.heading =
        (dronePosition.heading + 360) % 360;

    updateDroneHeading();
});

setInterval(async () => {

    await getTrackerStatus();

    simulateControllerFeedback();

    updateBeam();

    updateTargetLine();

    updateFlightTrail();
    
    updateCoverageSector();

    updateTelemetryUI();

    updateCompass();

    updateRadioLink();

    updateRadioLinkUI();

    if (followDrone) {

        map.panTo([
            dronePosition.lat,
            dronePosition.lon
        ]);
    }
}, 100);

initialize();
