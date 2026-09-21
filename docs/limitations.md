# S.A.G.A.R. System Limitations

While the S.A.G.A.R. pipeline is designed to be robust, it operates under the following known physical and algorithmic limitations:

1. **Acoustic Shadows:** The model may struggle to detect anomalies situated directly within the acoustic shadow of large natural topologies (e.g., seabed ridges or large boulders).
2. **Speckle Noise Extreme Environments:** Very high levels of speckle noise, beyond standard filtering capabilities, can reduce confidence scores and slightly increase false negatives.
3. **High-Motion Distortion:** If the Towfish (sonar array) experiences extreme heave, pitch, or roll that cannot be adequately corrected by the IMU data during preprocessing, the resulting distorted tiles will lower detection accuracy.
4. **Resolution Boundaries:** Objects smaller than 10cm x 10cm are difficult to confidently identify at a standard 640x640 tile extraction resolution.
5. **Class Imbalance:** Certain rare anomalies may have lower recall than frequent objects like pipelines or shipwrecks.
