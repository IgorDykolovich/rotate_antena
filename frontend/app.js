/*
=========================================================
Drone Tracker

Module:
app.js

Purpose:
Application lifecycle

Version:
3.0.1

Author:
Igor + ChatGPT
=========================================================
*/

function updateAntennaTracking() {

    let azDiff =
    AppState.tracker.targetAzimuth -
    AppState.tracker.currentAzimuth;

    if (azDiff > 180) azDiff -= 360;
    if (azDiff < -180) azDiff += 360;
    if (Math.abs(azDiff) >
        AppState.antenna.rotationSpeed) {

        AppState.tracker.currentAzimuth +=
            Math.sign(azDiff) *
            AppState.antenna.rotationSpeed;
    }
    else {

        AppState.tracker.currentAzimuth =
            AppState.tracker.targetAzimuth;
    }
    const elDiff =
    AppState.tracker.targetElevation -
    AppState.tracker.currentElevation;

    if (
        Math.abs(elDiff) >
        AppState.antenna.rotationSpeed
    ) {
        AppState.tracker.currentElevation +=
            Math.sign(elDiff) *
            AppState.antenna.rotationSpeed;
    }
    else {
        AppState.tracker.currentElevation =
            AppState.tracker.targetElevation;
    }
    AppState.tracker.currentAzimuth =
    (AppState.tracker.currentAzimuth + 360) % 360;
}

function initializeUI() {

    setupFollowButton();

    setupAutoViewButton();
}

function initializeMapObjects() {

    createMarkers();
}

async function updateTracker() {

    await getTrackerStatus();

    simulateControllerFeedback();
}

function updateRenderer() {

    updateBeam();

    updateTargetLine();

    updateFlightTrail();

    updateCoverageSector();

    updateCompass();
}

function updateUI() {

    updateTelemetryUI();

    updateRadioLinkUI();
}

function updateRadio() {

    updateRadioLink();
}

async function mainLoop() {

    if (telemetryMode !== TelemetryMode.MANUAL) {

        await getTelemetry();

    }

    await updateTracker();

    if (telemetryMode === TelemetryMode.MANUAL) {

        await calculate();

    }

    updateRenderer();

    updateUI();

    updateRadio();
}

function renderAll() {

    updateBeam();

    updateTargetLine();

    updateCoverageSector();

    updateTelemetryUI();

    updateCompass();

    updateRadioLink();

    updateRadioLinkUI();
}

async function loadInitialState() {

    await getTelemetry();

    await calculate();

    await getTrackerStatus();
}  

async function initialize() {

    initializeMapObjects();

    initializeUI();

    await loadInitialState();

    renderAll();
}

document.addEventListener('keydown', (e) => {

    if (e.key === 'ArrowLeft') {

        AppState.telemetry.position.heading -= 5;
    }

    if (e.key === 'ArrowRight') {

        AppState.telemetry.position.heading += 5;
    }

    AppState.telemetry.position.heading =
        (AppState.telemetry.position.heading + 360) % 360;

    updateDroneHeading();
});

setInterval(
    mainLoop,
    100
);

initialize();
