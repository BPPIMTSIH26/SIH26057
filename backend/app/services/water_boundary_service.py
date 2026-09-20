"""
Authoritative Geospatial Water-Boundary and Coordinate Validation Service.

Validates that all sonar and bathymetric anomalies are located strictly inside
approved water bodies, harbor basins, or survey corridors.
Detects coordinate order errors (swapped lat/lon), sign errors, out-of-range bounds,
and land-based points.
"""

from typing import Dict, Any, Tuple, Optional, List
from shapely.geometry import Point, Polygon
import logging

logger = logging.getLogger(__name__)

# Canonical Port Water-Body Polygons [longitude, latitude] in WGS84 GeoJSON standard
PORT_WATER_POLYGONS: Dict[str, List[List[float]]] = {
    # Mumbai Harbor: Water basin strictly east of South Mumbai peninsula, between docklands and Uran
    "mumbai": [
        [72.845, 18.880],
        [72.848, 18.900],
        [72.846, 18.930],
        [72.855, 18.960],
        [72.865, 19.010],
        [72.955, 19.010],
        [72.960, 18.950],
        [72.945, 18.880],
        [72.845, 18.880]
    ],
    # Chennai Port: Bay of Bengal waters directly east of Chennai coastline
    "chennai": [
        [80.294, 13.040],
        [80.380, 13.040],
        [80.380, 13.160],
        [80.294, 13.160],
        [80.294, 13.040]
    ],
    # Kochi Harbor: Arabian sea approach corridor and inner harbor channels between Vypin and Fort Kochi
    "kochi": [
        [76.160, 9.940],
        [76.275, 9.940],
        [76.275, 10.020],
        [76.160, 10.020],
        [76.160, 9.940]
    ],
    # Visakhapatnam Port: Bay of Bengal waters east of Dolphin's Nose & outer harbor
    "visakhapatnam": [
        [83.275, 17.650],
        [83.360, 17.650],
        [83.360, 17.740],
        [83.275, 17.740],
        [83.275, 17.650]
    ],
    # Kolkata Port: Hooghly River fairway
    "kolkata": [
        [88.290, 22.500],
        [88.320, 22.500],
        [88.320, 22.580],
        [88.290, 22.580],
        [88.290, 22.500]
    ],
    # Jawaharlal Nehru Port: Nhava Sheva water corridor
    "jawaharlal-nehru": [
        [72.930, 18.920],
        [72.980, 18.920],
        [72.980, 18.980],
        [72.930, 18.980],
        [72.930, 18.920]
    ],
    # Paradip Port: Bay of Bengal approach
    "paradip": [
        [86.680, 20.240],
        [86.780, 20.240],
        [86.780, 20.320],
        [86.680, 20.320],
        [86.680, 20.240]
    ],
    # Thunder Bay: Lake Huron waters (Western hemisphere: negative longitude)
    "thunder-bay": [
        [-83.450, 45.020],
        [-83.250, 45.020],
        [-83.250, 45.120],
        [-83.450, 45.120],
        [-83.450, 45.020]
    ],
    # Lake Huron: Open lake waters (Western hemisphere: negative longitude)
    "lake-huron": [
        [-83.460, 45.000],
        [-83.200, 45.000],
        [-83.200, 45.150],
        [-83.460, 45.150],
        [-83.460, 45.000]
    ]
}

# Pre-instantiate Shapely polygons for high performance point-in-polygon queries
_SHAPELY_POLYGONS: Dict[str, Polygon] = {
    port_id: Polygon(coords) for port_id, coords in PORT_WATER_POLYGONS.items()
}


class WaterBoundaryService:
    @staticmethod
    def get_water_polygon(port_id: str) -> Optional[List[List[float]]]:
        """Returns the GeoJSON coordinate ring for a given port's water body."""
        return PORT_WATER_POLYGONS.get(port_id)

    @staticmethod
    def get_geojson_boundary(port_id: str) -> Optional[Dict[str, Any]]:
        """Returns a GeoJSON Feature representing the approved water boundary for a port."""
        coords = PORT_WATER_POLYGONS.get(port_id)
        if not coords:
            return None
        return {
            "type": "Feature",
            "properties": {
                "port_id": port_id,
                "status": "APPROVED_WATER_BOUNDARY",
                "boundary_type": "SURVEY_CORRIDOR"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords]
            }
        }

    @staticmethod
    def validate_coordinate(
        latitude: Any,
        longitude: Any,
        port_id: Optional[str] = None
    ) -> Tuple[str, Optional[str], Optional[float], Optional[float]]:
        """
        Authoritative validation of coordinate.
        Returns:
            (coordinate_status, validation_reason, normalized_lat, normalized_lng)

        Status values:
            - VALIDATED_WATER: Confirmed inside the port's approved water polygon
            - ON_LAND: Outside water polygon / inside known land boundary
            - OUTSIDE_PORT_SCOPE: Point is not in the geographic bounding region of this port
            - INVALID_COORDINATE: Non-numeric, NaN, infinite, or out of range [-90,90] / [-180,180]
            - REQUIRES_MANUAL_REVIEW: No polygon defined or ambiguous reading
        """
        # 1. Type and finiteness validation
        try:
            lat = float(latitude)
            lng = float(longitude)
        except (TypeError, ValueError):
            return "INVALID_COORDINATE", "Coordinate values must be numeric", None, None

        import math
        if math.isnan(lat) or math.isnan(lng) or math.isinf(lat) or math.isinf(lng):
            return "INVALID_COORDINATE", "Coordinate values cannot be NaN or Infinite", None, None

        # 2. Strict lat/lon boundary validation
        if not (-90.0 <= lat <= 90.0):
            return "INVALID_COORDINATE", f"Latitude {lat} is outside allowable range [-90, 90]", None, None
        if not (-180.0 <= lng <= 180.0):
            return "INVALID_COORDINATE", f"Longitude {lng} is outside allowable range [-180, 180]", None, None

        # 3. Swap detection heuristic
        # If coordinates for Indian ports appear with lat > 60 and lng < 30, they are likely swapped
        if port_id in ["mumbai", "chennai", "kochi", "visakhapatnam", "kolkata", "jawaharlal-nehru", "paradip"]:
            if lat > 60.0 and 0.0 < lng < 40.0:
                return "INVALID_COORDINATE", f"Likely swapped latitude/longitude: lat={lat}, lng={lng}", None, None

        # 4. Longitude sign validation for Western Hemisphere ports
        if port_id in ["thunder-bay", "lake-huron"] and lng > 0:
            return "INVALID_COORDINATE", f"Great Lakes ports require negative (West) longitude, received {lng}", None, None

        if not port_id or port_id not in _SHAPELY_POLYGONS:
            return "REQUIRES_MANUAL_REVIEW", f"No approved water boundary registered for port '{port_id}'", lat, lng

        # 5. Point-in-Polygon check against approved water boundary
        # Note: Shapely Point takes (x, y) = (longitude, latitude)
        point = Point(lng, lat)
        poly = _SHAPELY_POLYGONS[port_id]

        if poly.contains(point) or poly.touches(point):
            return "VALIDATED_WATER", None, round(lat, 6), round(lng, 6)

        # 6. If outside, determine if it is near the port on land vs far outside
        min_lng, min_lat, max_lng, max_lat = poly.bounds
        # Generous buffer around port area (0.1 degree ~ 11 km)
        if (min_lat - 0.1 <= lat <= max_lat + 0.1) and (min_lng - 0.1 <= lng <= max_lng + 0.1):
            return "ON_LAND", f"Coordinates ({lat}, {lng}) fall on land or outside the approved water basin of {port_id}", round(lat, 6), round(lng, 6)

        return "OUTSIDE_PORT_SCOPE", f"Coordinates ({lat}, {lng}) fall outside the operational corridor of {port_id}", round(lat, 6), round(lng, 6)
