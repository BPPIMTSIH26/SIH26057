import time
import cv2
import numpy as np

img = np.random.randint(0, 255, (4000, 4000), dtype=np.uint8)

t0 = time.time()
cv2.medianBlur(img, 5)
print("MedianBlur:", time.time() - t0)

t0 = time.time()
cv2.GaussianBlur(img, (5, 5), 0)
print("GaussianBlur:", time.time() - t0)
