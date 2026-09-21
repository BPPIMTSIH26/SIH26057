import random

PORT_WATER_POLYGONS = {
    'chennai': [
        [80.290, 13.100], [80.320, 13.100], [80.320, 13.070], [80.290, 13.070], [80.290, 13.100]
    ],
    'mumbai': [
        [72.840, 18.970], [72.950, 18.970], [72.950, 18.880], [72.840, 18.880], [72.840, 18.970]
    ],
    'kolkata': [
        [88.305, 22.560], [88.315, 22.560], [88.315, 22.540], [88.305, 22.540], [88.305, 22.560]
    ],
    'paradip': [
        [86.680, 20.280], [86.720, 20.280], [86.720, 20.240], [86.680, 20.240], [86.680, 20.280]
    ],
    'kochi': [
        [76.240, 9.980], [76.280, 9.980], [76.280, 9.930], [76.240, 9.930], [76.240, 9.980]
    ],
    'jawaharlal-nehru': [
        [72.910, 18.960], [72.940, 18.960], [72.940, 18.930], [72.910, 18.930], [72.910, 18.960]
    ],
    'visakhapatnam': [
        [83.290, 17.710], [83.320, 17.710], [83.320, 17.680], [83.290, 17.680], [83.290, 17.710]
    ],
    'thunder-bay': [
        [-89.200, 48.430], [-89.150, 48.430], [-89.150, 48.380], [-89.200, 48.380], [-89.200, 48.430]
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
