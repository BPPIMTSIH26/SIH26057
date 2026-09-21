import time
import cv2
import numpy as np

img = np.random.randint(0, 255, (4000, 4000, 3), dtype=np.uint8)

t0 = time.time()
cv2.imwrite("test.png", img)
print("Write PNG:", time.time() - t0)

t0 = time.time()
cv2.imwrite("test.jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
print("Write JPG:", time.time() - t0)
