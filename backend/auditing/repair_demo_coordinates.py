import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import scripts.force_all_to_water as force_all_to_water

if __name__ == "__main__":
    force_all_to_water.run()
