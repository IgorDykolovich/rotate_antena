from pymavlink import mavutil

from state.drone_state import drone_state

import asyncio


master = None


async def mavlink_listener():

    global master

    print("MAVLink listener started")

    while True:

        try:

            if master is None:

                print("Connecting to COM14...")

                master = mavutil.mavlink_connection(
                    "COM14",
                    baud=115200
                )

                print("COM14 connected")

            await asyncio.sleep(1)

        except Exception as error:

            print(error)

            master = None

            await asyncio.sleep(5)