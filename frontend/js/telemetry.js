async function calculate() {

    let data; 
    try{    
        console.log("DRONE");

        console.log({
            home: homePosition,
            drone: dronePosition
        });
        const response = await fetch(
            'http://localhost:8000/api/v1/calculate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    home: AppState.home,
                    drone: AppState.telemetry.position
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

        return;
    }
    setTrackerTarget(
        data.azimuth_deg,
        data.elevation_deg
    );
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

function useSimulatorTelemetry() {

    telemetryMode = TelemetryMode.SIMULATOR;

} 

async function getTelemetry() {

    try {

        const response = await fetch(
            'http://localhost:8000/api/v1/telemetry'
        );

        const data = await response.json();
        setDronePosition(
            "FROM TELEMETRY",
            data.position.lat,
            data.position.lon,
            data.position.altitude
        );

        setDroneAttitude(
            data.attitude.heading,
            data.attitude.roll,
            data.attitude.pitch
        );

        await calculate();
    } catch(error) {

        console.error(error);
    }
}