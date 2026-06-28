const radioLink = {
    quality: 100,
    rssi: -60,
    snr: 12,
    packetLoss: 0
};

function updateRadioLink() {

    const distanceKm = parseFloat(

        document.getElementById(
            'distance'
        ).innerText

        .replace(
            'Distance: ',
            ''
        )

        .replace(
            ' km',
            ''
        )
    );

    const trackingError =
        getAngleError(

            antennaState.targetAzimuth,

            antennaState.currentAzimuth
        );

    let quality = 100;

    quality -= distanceKm * 2;

    quality -= trackingError * 1.5;

    if (!isTargetReachable()) {
        quality -= 40;
    }

    quality = Math.max(
        0,
        Math.min(
            100,
            quality
        )
    );

    radioLink.quality =
        Math.round(quality);

    radioLink.rssi = Math.round(
        -100 + radioLink.quality * 0.4
    );

    radioLink.snr = Math.round(
        -10 + radioLink.quality * 0.22
    );

    radioLink.packetLoss = Math.round(
        (100 - radioLink.quality) / 3
    );
}

function updateRadioLinkUI() {

    document.getElementById(
        'linkQuality'
    ).innerText =

        `Link Quality: ${radioLink.quality}%`;

    document.getElementById(
        'rssi'
    ).innerText =

        `RSSI: ${radioLink.rssi} dBm`;

    document.getElementById(
        'snr'
    ).innerText =

        `SNR: ${radioLink.snr} dB`;

    document.getElementById(
        'packetLoss'
    ).innerText =

        `Packet Loss: ${radioLink.packetLoss}%`;
}