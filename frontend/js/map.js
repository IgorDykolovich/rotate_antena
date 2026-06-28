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
let flightTrail = [];
let trailLine = null;
let coverageSector = null;
let beamLine = null;
let followDrone = false;
let targetOutOfRange = false;

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

function updateFlightTrail() {

    const newPoint = [
        dronePosition.lat,
        dronePosition.lon
    ];

    if (flightTrail.length > 0) {

        const lastPoint =
            flightTrail[
                flightTrail.length - 1
            ];

        const distance =
            distanceBetweenPoints(
                lastPoint[0],
                lastPoint[1],
                newPoint[0],
                newPoint[1]
            );

        if (distance < 5) {
            return;
        }
    }

    flightTrail.push(newPoint);

    if (flightTrail.length > 1000) {
        flightTrail.shift();
    }

    if (trailLine) {
        map.removeLayer(trailLine);
    }

    trailLine = L.polyline(
        flightTrail,
        {
            color: '#d80707',
            weight: 2,
            opacity: 0.7
        }
    ).addTo(map);
}

function updateDroneHeading() {

    const icon =
        document.getElementById('droneIcon');

    if (!icon) return;

    icon.style.transform =
        `rotate(${dronePosition.heading}deg)`;
}

function distanceBetweenPoints(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );
}

map.on('contextmenu', async function(e) {

    homePosition.lat = e.latlng.lat;
    homePosition.lon = e.latlng.lng;

    homeMarker.setLatLng(e.latlng);

    await calculate();
});
