from app.database.models import Detection

class RiskService:
    def calculate_risk(self, detection: Detection, shadow_confidence: float = None) -> dict:
        """
        Logistic calibration & S.A.G.A.R risk scoring
        Uses a logistic curve to calibrate raw confidence into a 0-100 risk score.
        Applies optional acoustic shadow penalty.
        """
        import math
        
        raw_conf = detection.confidence
        # Logistic Calibration parameters (derived from S.A.G.A.R reference)
        k = 10.0 # steepness
        x0 = 0.65 # midpoint
        
        calibrated_conf = 1 / (1 + math.exp(-k * (raw_conf - x0)))
        
        score = calibrated_conf * 60.0 # Confidence is up to 60 points
        
        # Class factor (0 to 25)
        class_weights = {
            "ghost_net": 25,
            "fishing_gear": 20,
            "metal_debris": 15,
            "unknown_man_made_object": 5
        }
        score += class_weights.get(detection.class_name, 5)
        
        # Size factor (0 to 15)
        area = detection.area or 1000
        size_factor = min(15, (area / 50000) * 15)
        score += size_factor
        
        # Optional Acoustic Shadow Penalty (reduces score if shadow is missing)
        shadow_penalty = 0.0
        if shadow_confidence is not None:
            if shadow_confidence < 0.3:
                shadow_penalty = 15.0
            elif shadow_confidence < 0.5:
                shadow_penalty = 5.0
            score -= shadow_penalty
        
        # Cap at 100, floor at 0
        score = max(0.0, min(100.0, score))
        
        # Determine level (Review Bands)
        if score < 30:
            level = "LOW_REVIEW"
        elif score < 60:
            level = "MODERATE_REVIEW"
        elif score < 85:
            level = "HIGH_PRIORITY"
        else:
            level = "CRITICAL_INTERVENTION"
            
        factors = {
            "raw_confidence": raw_conf,
            "calibrated_confidence_score": round(calibrated_conf * 60, 1),
            "class_contribution": class_weights.get(detection.class_name, 5),
            "size_contribution": round(size_factor, 1),
            "shadow_penalty": shadow_penalty
        }
        
        return {
            "risk_score": round(score, 1),
            "risk_level": level,
            "risk_factors": factors
        }
