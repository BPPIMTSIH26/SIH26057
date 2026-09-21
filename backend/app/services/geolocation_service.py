from app.database.models import Mission, Detection
from app.utils.geo_utils import calculate_offset

class GeolocationService:
    def locate_detection(self, mission: Mission, detection: Detection, image_width: int, image_height: int = 1000, max_range: float = None):
        """
        Calculates geographical coordinates for a detection based on mission metadata
        and its pixel position in the sonar image.
        Maps image rows to along-track distance and columns to across-track (ground) range.
        """
        if not mission.latitude or not mission.longitude:
            return {
                "latitude": None,
                "longitude": None,
                "depth": mission.depth,
                "range": 0,
                "location_source": "MISSING_NAV"
            }
            
        heading = mission.heading or 0.0
        sonar_range = mission.sonar_range or max_range or 100.0
        
        # Calculate offset based on bbox center x coordinate (across-track)
        # Port is left (-1), starboard is right (+1)
        center_x = (detection.bbox_x1 + detection.bbox_x2) / 2.0
        rel_pos_x = (center_x - (image_width / 2.0)) / (image_width / 2.0)
        across_track_meters = rel_pos_x * sonar_range
        
        # Calculate along-track offset based on bbox center y
        # Assuming y=0 is the current nav point (top of image) and y grows backwards along the track.
        # Alternatively, if image is a snapshot, center_y = 0 offset. Let's assume center_y is the nav point.
        center_y = (detection.bbox_y1 + detection.bbox_y2) / 2.0
        rel_pos_y = ((image_height / 2.0) - center_y) / (image_height / 2.0)
        # Assume aspect ratio of image pixels relates to physical aspect roughly 1:1 if uncorrected
        along_track_meters = rel_pos_y * sonar_range
        
        # Combine across-track and along-track into a single bearing and distance
        import math
        distance_meters = math.hypot(across_track_meters, along_track_meters)
        angle_rad = math.atan2(across_track_meters, along_track_meters)
        bearing = (heading + math.degrees(angle_rad)) % 360
        
        new_lat, new_lon = calculate_offset(
            lat=mission.latitude,
            lon=mission.longitude,
            heading_deg=bearing,
            offset_meters=distance_meters
        )
        
        return {
            "latitude": new_lat,
            "longitude": new_lon,
            "depth": mission.depth,
            "range": distance_meters,
            "location_source": "MAPPED_FROM_METADATA"
        }
