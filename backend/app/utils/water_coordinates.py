import random

PORT_WATER_POLYGONS = {
    'chennai': [
        [80.295, 13.060], [80.350, 13.060], [80.350, 13.130], [80.295, 13.130], [80.295, 13.060]
    ],
    'mumbai': [
        [72.855, 18.890], [72.930, 18.890], [72.930, 18.960], [72.865, 18.960], [72.855, 18.890]
    ],
    'kolkata': [
        [88.270, 22.495], [88.295, 22.515], [88.310, 22.530], [88.322, 22.555],
        [88.310, 22.565], [88.298, 22.540], [88.285, 22.525], [88.265, 22.505], [88.270, 22.495]
    ],
    'paradip': [
        [86.690, 20.230], [86.760, 20.230], [86.760, 20.300], [86.690, 20.300], [86.690, 20.230]
    ],
    'kochi': [
        [76.160, 9.930], [76.245, 9.930], [76.245, 10.000], [76.160, 10.000], [76.160, 9.930]
    ],
    'jawaharlal-nehru': [
        [72.880, 18.910], [72.935, 18.910], [72.935, 18.960], [72.880, 18.960], [72.880, 18.910]
    ],
    'visakhapatnam': [
        [83.285, 17.650], [83.350, 17.650], [83.350, 17.730], [83.285, 17.650]
    ],
    'thunder-bay': [
        [-83.420, 45.000], [-83.250, 45.000], [-83.250, 45.090], [-83.320, 45.055], [-83.420, 45.050], [-83.420, 45.000]
    ]
}

DEMO_SEEDS = {
    'mumbai': 17001,
    'chennai': 17002,
    'kolkata': 17003,
    'kochi': 17004,
    'visakhapatnam': 17005,
    'jawaharlal-nehru': 17006,
    'paradip': 17007,
    'thunder-bay': 17008,
}

def point_in_polygon(x, y, polygon):
    """Ray-casting algorithm for point in polygon."""
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xints:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def get_bounding_box(polygon):
    min_x = min([p[0] for p in polygon])
    max_x = max([p[0] for p in polygon])
    min_y = min([p[1] for p in polygon])
    max_y = max([p[1] for p in polygon])
    return min_x, min_y, max_x, max_y

def get_random_water_coordinate(port_id, prng):
    polygon = PORT_WATER_POLYGONS.get(port_id)
    if not polygon:
        raise ValueError(f"Port ID {port_id} not found in water polygons.")
    
    min_x, min_y, max_x, max_y = get_bounding_box(polygon)
    max_attempts = 500
    for _ in range(max_attempts):
        x = min_x + prng.random() * (max_x - min_x)
        y = min_y + prng.random() * (max_y - min_y)
        if point_in_polygon(x, y, polygon):
            return y, x # lat, lng
            
    raise RuntimeError(f"Failed to find water coordinate for {port_id} after {max_attempts} attempts.")
