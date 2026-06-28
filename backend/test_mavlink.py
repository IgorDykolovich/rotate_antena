from pymavlink import mavutil

print("Connecting...")

master = mavutil.mavlink_connection(
    "COM14",
    baud=115200
)

print("Waiting for messages...")

while True:

    msg = master.recv_match(
        blocking=True,
        timeout=5
    )

    print(msg)