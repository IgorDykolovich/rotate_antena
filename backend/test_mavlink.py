from pymavlink import mavutil

print("Connecting...")

master = mavutil.mavlink_connection(
    "COM14",
    baud=115200
)

msg = master.recv_match(
    blocking=True,
    timeout=10
)

print(msg)