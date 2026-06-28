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