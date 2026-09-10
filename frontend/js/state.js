/*
=========================================================
Drone Tracker

Module:
state.js

Purpose:
Global application state

Version:
4.0.0

Author:
Igor + ChatGPT
=========================================================
*/

//=========================================================
// Application State
//=========================================================

const AppState = {

    telemetry: {

        position: {

            lat: 50.4501,
            lon: 30.5234,
            altitude: 100
        },

        attitude: {

            heading: 0,
            roll: 0,
            pitch: 0
        }
    },

    home: {

        lat: 50.4501,
        lon: 30.5234,
        height: 10
    },

    tracker: {

        connected: true,

        currentAzimuth: 90,
        currentElevation: 20,

        targetAzimuth: 90,
        targetElevation: 20
    },

    antenna: {

        azimuthMin: 45,
        azimuthMax: 130,

        elevationMin: 0,
        elevationMax: 90,

        rotationSpeed: 1
    },

    controller: {

        connected: true,

        txAzimuth: 0,
        txElevation: 0,

        rxAzimuth: 0,
        rxElevation: 0
    },

    radio: {

        rssi: -60,
        snr: 10,
        linkQuality: 100,
        packetLoss: 0
    },

    ui: {

        followDrone: false,
        autoView: false
    }

};

//=========================================================
// Compatibility Layer
//=========================================================

const dronePosition =
    AppState.telemetry.position;

const homePosition =
    AppState.home;

const antennaState = {

    get currentAzimuth() {
        return AppState.tracker.currentAzimuth;
    },

    set currentAzimuth(value) {
        AppState.tracker.currentAzimuth = value;
    },

    get currentElevation() {
        return AppState.tracker.currentElevation;
    },

    set currentElevation(value) {
        AppState.tracker.currentElevation = value;
    },

    get targetAzimuth() {
        return AppState.tracker.targetAzimuth;
    },

    set targetAzimuth(value) {
        AppState.tracker.targetAzimuth = value;
    },

    get targetElevation() {
        return AppState.tracker.targetElevation;
    },

    set targetElevation(value) {
        AppState.tracker.targetElevation = value;
    },

    get azimuthMin() {
        return AppState.antenna.azimuthMin;
    },

    get azimuthMax() {
        return AppState.antenna.azimuthMax;
    },

    get elevationMin() {
        return AppState.antenna.elevationMin;
    },

    get elevationMax() {
        return AppState.antenna.elevationMax;
    },

    get rotationSpeed() {
        return AppState.antenna.rotationSpeed;
    }

};

const controllerState =
    AppState.controller;

const radioState =
    AppState.radio;

//---------------------------------------------------------
// State API
//---------------------------------------------------------

function setDronePosition(lat, lon, altitude) {

    AppState.telemetry.position.lat = lat;
    AppState.telemetry.position.lon = lon;
    AppState.telemetry.position.altitude = altitude;

}

function setDroneAttitude(heading, roll, pitch) {

    AppState.telemetry.attitude.heading = heading;
    AppState.telemetry.attitude.roll = roll;
    AppState.telemetry.attitude.pitch = pitch;

}

function setHomePosition(lat, lon, height) {

    AppState.home.lat = lat;
    AppState.home.lon = lon;
    AppState.home.height = height;

}

function setTrackerTarget(azimuth, elevation) {

    AppState.tracker.targetAzimuth = azimuth;
    AppState.tracker.targetElevation = elevation;

}

function setTrackerCurrent(azimuth, elevation) {

    AppState.tracker.currentAzimuth = azimuth;
    AppState.tracker.currentElevation = elevation;

}