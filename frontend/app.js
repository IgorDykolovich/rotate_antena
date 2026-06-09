const homePosition = {
    lat: 50.4501,
    lon: 30.5234,
    height: 3
};

const dronePosition = {
    lat: 50.4600,
    lon: 30.5400,
    altitude: 180,
    heading: 90
};

const antennaState = {

    azimuthMin: 45,
    azimuthMax: 130,

    elevationMin: 0,
    elevationMax: 90,

    currentAzimuth: 0,
    currentElevation: 0,

    targetAzimuth: 0,
    targetElevation: 0,

    rotationSpeed: 1.5
};

const controllerState = {

    connected: true,

    txAzimuth: 0,
    txElevation: 0,

    rxAzimuth: 0,
    rxElevation: 0,

    lastUpdate: Date.now()
};

const map = L.map('map').setView(
    [homePosition.lat, homePosition.lon],
    13
);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19
    }
).addTo(map);

let homeMarker = null;
let droneMarker = null;
let line = null;
let targetLine = null;
let distanceLabel = null;
let coverageSector = null;
let beamLine = null;

const droneIcon = L.divIcon({
    className: '',
    html: `
        <div id="droneIcon" style="
            width:32px;
            height:32px;
            transform: rotate(${dronePosition.heading}deg);
        ">
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
            >
                <polygon
                    points="16,2 28,28 16,22 4,28"
                    fill="#00ff88"
                    stroke="#000"
                    stroke-width="1"
                />
            </svg>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const antennaIcon = L.divIcon({
    className: '',
    html: `
        <div style="
            width:28px;
            height:28px;
        ">
            <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
            >
                <circle
                    cx="16"
                    cy="16"
                    r="10"
                    fill="#3399ff"
                    stroke="#000"
                    stroke-width="2"
                />

                <path
                    d="M16 2 L16 30"
                    stroke="white"
                    stroke-width="2"
                />

                <path
                    d="M2 16 L30 16"
                    stroke="white"
                    stroke-width="2"
                />
            </svg>
        </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

function updateCoverageSector() {

    if (coverageSector) {
        map.removeLayer(coverageSector);
    }

    const radiusKm = 5;

    const points = [];

    points.push([
        homePosition.lat,
        homePosition.lon
    ]);

    for (
        let angle = antennaState.azimuthMin;
        angle <= antennaState.azimuthMax;
        angle += 5
    ) {

        const rad =
            angle * Math.PI / 180;

        const lat =
            homePosition.lat +
            (radiusKm / 111) *
            Math.cos(rad);

        const lon =
            homePosition.lon +
            (radiusKm /
            (
                111 *
                Math.cos(
                    homePosition.lat *
                    Math.PI / 180
                )
            )) *
            Math.sin(rad);

        points.push([lat, lon]);
    }

    points.push([
        homePosition.lat,
        homePosition.lon
    ]);

    coverageSector = L.polygon(
        points,
        {
            color: '#ffaa00',
            weight: 2,
            fillOpacity: 0.15
        }
    ).addTo(map);
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

function createMarkers() {

    homeMarker = L.marker([
        homePosition.lat,
        homePosition.lon
    ], {
        draggable: true,
        icon: antennaIcon
    }).addTo(map);

    homeMarker.on('dragend', async (e) => {

    const pos = e.target.getLatLng();

    homePosition.lat = pos.lat;
    homePosition.lon = pos.lng;

    updateTelemetryUI();

    await calculate();
});

    droneMarker = L.marker([
        dronePosition.lat,
        dronePosition.lon
    ], {
        draggable: true,
        icon: droneIcon
    }).addTo(map);

    droneMarker.on('drag', async (e) => {

        const pos = e.target.getLatLng();

        dronePosition.lat = pos.lat;
        dronePosition.lon = pos.lng;

        await calculate();
    });
}

function updateLine() {

    if (line) {
        map.removeLayer(line);
    }

    if (distanceLabel) {
        map.removeLayer(distanceLabel);
    }

    const points = [
        [homePosition.lat, homePosition.lon],
        [dronePosition.lat, dronePosition.lon]
    ];

    line = L.polyline(points, {
        color: '#00ff88',
        weight: 3
    }).addTo(map);

    const centerLat =
        (homePosition.lat + dronePosition.lat) / 2;

    const centerLon =
        (homePosition.lon + dronePosition.lon) / 2;

    const distanceText =
        document.getElementById('distance')
            .innerText
            .replace('Distance: ', '');

    distanceLabel = L.marker(
        [centerLat, centerLon],
        {
            interactive: false,
            icon: L.divIcon({
                className: 'distance-label',
                html: `
                    <div style="
                            background: #242424;
                            color: #00ff88;
                            padding: 4px 23px;
                            border-radius: 10px;
                            border: 1px solid #000000;
                            font-size: 15px;
                            padding-right: 49px;
                    ">
                        ${distanceText}
                    </div>
                `
            })
        }
    ).addTo(map);
}

function updateBeam() {

    if (beamLine) {
        map.removeLayer(beamLine);
    }

    const beamLengthKm = 3;

    const angleRad =
        antennaState.currentAzimuth *
        Math.PI / 180;

    const latOffset =
        (beamLengthKm / 111) *
        Math.cos(angleRad);

    const lonOffset =
        (beamLengthKm /
        (111 *
        Math.cos(
            homePosition.lat *
            Math.PI / 180
        ))) *
        Math.sin(angleRad);

    const beamEndLat =
        homePosition.lat + latOffset;

    const beamEndLon =
        homePosition.lon + lonOffset;

    beamLine = L.polyline([
        [homePosition.lat, homePosition.lon],
        [beamEndLat, beamEndLon]
    ], {
        color: '#00ffff',
        weight: 8,
        opacity: 0.25
    }).addTo(map);
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

function updateTargetLine() {

    if (targetLine) {
        map.removeLayer(targetLine);
    }

    targetLine = L.polyline([
        [homePosition.lat, homePosition.lon],
        [dronePosition.lat, dronePosition.lon]
    ], {
        color: '#ff4444',
        weight: 2,
        opacity: 0.9,
        dashArray: '8, 8'
    }).addTo(map);
}

async function calculate() {

    let data; 
    try{    
        const response = await fetch(
            'http://localhost:8000/api/v1/calculate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    home: homePosition,
                    drone: dronePosition
                })
            }
        );

        data = await response.json();
    }
    catch (error) {

    console.error(error);

    document.getElementById(
        'connectionStatus'
    ).innerText =
        'Status: DISCONNECTED';
    }
    antennaState.targetAzimuth =
    data.azimuth_deg;

    antennaState.targetElevation =
    data.elevation_deg;

    sendToController();

    await sendTrackerCommand();
    
    document.getElementById('distance').innerText =
        `Distance: ${data.distance_km} km`;

    document.getElementById('azimuth').innerText =
        `Azimuth: ${data.azimuth_deg}°`;

    document.getElementById('elevation').innerText =
        `Elevation: ${data.elevation_deg}°`;
    
    updateTelemetryUI();
    updateLine();
}

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

map.on('contextmenu', async function(e) {

    homePosition.lat = e.latlng.lat;
    homePosition.lon = e.latlng.lng;

    homeMarker.setLatLng(e.latlng);

    await calculate();
});

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

    if (azError > 5) {
        state = 'TRACKING';
    }
    else if (azError > 1) {
        state = 'ALIGNING';
    }
    else {
        state = 'LOCKED';
    }

    if (!isTargetReachable()) {

    state = 'OUT OF RANGE';
}

    document.getElementById('antennaState').innerText =
        `State: ${state}`;

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
}

function updateDroneHeading() {

    const icon =
        document.getElementById('droneIcon');

    if (!icon) return;

    icon.style.transform =
        `rotate(${dronePosition.heading}deg)`;
}

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

function getAngleError(a, b) {

    let diff = Math.abs(a - b);

    if (diff > 180) {
        diff = 360 - diff;
    }

    return diff;
}

async function getTelemetry() {

    try {

        const response = await fetch(
            'http://localhost:8000/api/v1/telemetry'
        );

        const data = await response.json();

        dronePosition.lat =
            data.lat;

        dronePosition.lon =
            data.lon;

        dronePosition.altitude =
            data.altitude;

        dronePosition.heading =
            data.heading;

    } catch(error) {

        console.error(error);
    }
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

async function initialize() {

    createMarkers();

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

    updateCoverageSector();

    updateTelemetryUI();

    updateCompass();

}, 100);

// setInterval(async () => {

//     await getTelemetry();

//     droneMarker.setLatLng([
//         dronePosition.lat,
//         dronePosition.lon
//     ]);

//     updateDroneHeading();

//     await calculate();

// }, 500);

initialize();
const homePosition = {
    lat: 50.4501,
    lon: 30.5234,
    height: 3
};

const dronePosition = {
    lat: 50.4600,
    lon: 30.5400,
    altitude: 180,
    heading: 90
};

const antennaState = {

    azimuthMin: 45,
    azimuthMax: 130,

    elevationMin: 0,
    elevationMax: 90,

    currentAzimuth: 0,
    currentElevation: 0,

    targetAzimuth: 0,
    targetElevation: 0,

    rotationSpeed: 1.5
};

const controllerState = {

    connected: true,

    txAzimuth: 0,
    txElevation: 0,

    rxAzimuth: 0,
    rxElevation: 0,

    lastUpdate: Date.now()
};

const map = L.map('map').setView(
    [homePosition.lat, homePosition.lon],
    13
);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19
    }
).addTo(map);

let homeMarker = null;
let droneMarker = null;
let line = null;
let targetLine = null;
let distanceLabel = null;
let coverageSector = null;
let beamLine = null;

const droneIcon = L.divIcon({
    className: '',
    html: `
        <div id="droneIcon" style="
            width:32px;
            height:32px;
            transform: rotate(${dronePosition.heading}deg);
        ">
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
            >
                <polygon
                    points="16,2 28,28 16,22 4,28"
                    fill="#00ff88"
                    stroke="#000"
                    stroke-width="1"
                />
            </svg>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const antennaIcon = L.divIcon({
    className: '',
    html: `
        <div style="
            width:28px;
            height:28px;
        ">
            <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
            >
                <circle
                    cx="16"
                    cy="16"
                    r="10"
                    fill="#3399ff"
                    stroke="#000"
                    stroke-width="2"
                />

                <path
                    d="M16 2 L16 30"
                    stroke="white"
                    stroke-width="2"
                />

                <path
                    d="M2 16 L30 16"
                    stroke="white"
                    stroke-width="2"
                />
            </svg>
        </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

function updateCoverageSector() {

    if (coverageSector) {
        map.removeLayer(coverageSector);
    }

    const radiusKm = 5;

    const points = [];

    points.push([
        homePosition.lat,
        homePosition.lon
    ]);

    for (
        let angle = antennaState.azimuthMin;
        angle <= antennaState.azimuthMax;
        angle += 5
    ) {

        const rad =
            angle * Math.PI / 180;

        const lat =
            homePosition.lat +
            (radiusKm / 111) *
            Math.cos(rad);

        const lon =
            homePosition.lon +
            (radiusKm /
            (
                111 *
                Math.cos(
                    homePosition.lat *
                    Math.PI / 180
                )
            )) *
            Math.sin(rad);

        points.push([lat, lon]);
    }

    points.push([
        homePosition.lat,
        homePosition.lon
    ]);

    coverageSector = L.polygon(
        points,
        {
            color: '#ffaa00',
            weight: 2,
            fillOpacity: 0.15
        }
    ).addTo(map);
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

function createMarkers() {

    homeMarker = L.marker([
        homePosition.lat,
        homePosition.lon
    ], {
        draggable: true,
        icon: antennaIcon
    }).addTo(map);

    homeMarker.on('dragend', async (e) => {

    const pos = e.target.getLatLng();

    homePosition.lat = pos.lat;
    homePosition.lon = pos.lng;

    updateTelemetryUI();

    await calculate();
});

    droneMarker = L.marker([
        dronePosition.lat,
        dronePosition.lon
    ], {
        draggable: true,
        icon: droneIcon
    }).addTo(map);

    droneMarker.on('drag', async (e) => {

        const pos = e.target.getLatLng();

        dronePosition.lat = pos.lat;
        dronePosition.lon = pos.lng;

        await calculate();
    });
}

function updateLine() {

    if (line) {
        map.removeLayer(line);
    }

    if (distanceLabel) {
        map.removeLayer(distanceLabel);
    }

    const points = [
        [homePosition.lat, homePosition.lon],
        [dronePosition.lat, dronePosition.lon]
    ];

    line = L.polyline(points, {
        color: '#00ff88',
        weight: 3
    }).addTo(map);

    const centerLat =
        (homePosition.lat + dronePosition.lat) / 2;

    const centerLon =
        (homePosition.lon + dronePosition.lon) / 2;

    const distanceText =
        document.getElementById('distance')
            .innerText
            .replace('Distance: ', '');

    distanceLabel = L.marker(
        [centerLat, centerLon],
        {
            interactive: false,
            icon: L.divIcon({
                className: 'distance-label',
                html: `
                    <div style="
                            background: #242424;
                            color: #00ff88;
                            padding: 4px 23px;
                            border-radius: 10px;
                            border: 1px solid #000000;
                            font-size: 15px;
                            padding-right: 49px;
                    ">
                        ${distanceText}
                    </div>
                `
            })
        }
    ).addTo(map);
}

function updateBeam() {

    if (beamLine) {
        map.removeLayer(beamLine);
    }

    const beamLengthKm = 3;

    const angleRad =
        antennaState.currentAzimuth *
        Math.PI / 180;

    const latOffset =
        (beamLengthKm / 111) *
        Math.cos(angleRad);

    const lonOffset =
        (beamLengthKm /
        (111 *
        Math.cos(
            homePosition.lat *
            Math.PI / 180
        ))) *
        Math.sin(angleRad);

    const beamEndLat =
        homePosition.lat + latOffset;

    const beamEndLon =
        homePosition.lon + lonOffset;

    beamLine = L.polyline([
        [homePosition.lat, homePosition.lon],
        [beamEndLat, beamEndLon]
    ], {
        color: '#00ffff',
        weight: 8,
        opacity: 0.25
    }).addTo(map);
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

function updateTargetLine() {

    if (targetLine) {
        map.removeLayer(targetLine);
    }

    targetLine = L.polyline([
        [homePosition.lat, homePosition.lon],
        [dronePosition.lat, dronePosition.lon]
    ], {
        color: '#ff4444',
        weight: 2,
        opacity: 0.9,
        dashArray: '8, 8'
    }).addTo(map);
}

async function calculate() {

    let data; 
    try{    
        const response = await fetch(
            'http://localhost:8000/api/v1/calculate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    home: homePosition,
                    drone: dronePosition
                })
            }
        );

        data = await response.json();
    }
    catch (error) {

    console.error(error);

    document.getElementById(
        'connectionStatus'
    ).innerText =
        'Status: DISCONNECTED';
    }
    antennaState.targetAzimuth =
    data.azimuth_deg;

    antennaState.targetElevation =
    data.elevation_deg;

    sendToController();

    await sendTrackerCommand();
    
    document.getElementById('distance').innerText =
        `Distance: ${data.distance_km} km`;

    document.getElementById('azimuth').innerText =
        `Azimuth: ${data.azimuth_deg}°`;

    document.getElementById('elevation').innerText =
        `Elevation: ${data.elevation_deg}°`;
    
    updateTelemetryUI();
    updateLine();
}

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

map.on('contextmenu', async function(e) {

    homePosition.lat = e.latlng.lat;
    homePosition.lon = e.latlng.lng;

    homeMarker.setLatLng(e.latlng);

    await calculate();
});

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

    if (azError > 5) {
        state = 'TRACKING';
    }
    else if (azError > 1) {
        state = 'ALIGNING';
    }
    else {
        state = 'LOCKED';
    }

    if (!isTargetReachable()) {

    state = 'OUT OF RANGE';
}

    document.getElementById('antennaState').innerText =
        `State: ${state}`;

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
}

function updateDroneHeading() {

    const icon =
        document.getElementById('droneIcon');

    if (!icon) return;

    icon.style.transform =
        `rotate(${dronePosition.heading}deg)`;
}

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

function getAngleError(a, b) {

    let diff = Math.abs(a - b);

    if (diff > 180) {
        diff = 360 - diff;
    }

    return diff;
}

async function getTelemetry() {

    try {

        const response = await fetch(
            'http://localhost:8000/api/v1/telemetry'
        );

        const data = await response.json();

        dronePosition.lat =
            data.lat;

        dronePosition.lon =
            data.lon;

        dronePosition.altitude =
            data.altitude;

        dronePosition.heading =
            data.heading;

    } catch(error) {

        console.error(error);
    }
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

async function initialize() {

    createMarkers();

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

    updateCoverageSector();

    updateTelemetryUI();

    updateCompass();

}, 100);

// setInterval(async () => {

//     await getTelemetry();

//     droneMarker.setLatLng([
//         dronePosition.lat,
//         dronePosition.lon
//     ]);

//     updateDroneHeading();

//     await calculate();

// }, 500);

initialize();
