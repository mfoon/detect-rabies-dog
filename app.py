# app.py — Integrasi YOLOv8 dari yolo_detect.py ke backend Flask Web
from flask import Flask, render_template, request, jsonify 
from base64 import b64decode
from io import BytesIO
from PIL import Image
from ultralytics import YOLO
import numpy as np
import os
import yaml

app = Flask(__name__)

# Load model dari yolo_detect.py
MODEL_PATH = "my_model.pt"
assert os.path.exists(MODEL_PATH), "Model tidak ditemukan!"
model = YOLO(MODEL_PATH)
labels = model.names

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/detect", methods=["POST"])
def detect():
    try:
        data = request.get_json()
        image_b64 = data['image'].split(',')[1]
        image_bytes = b64decode(image_b64)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        frame = np.array(image)

        results = model(frame, verbose=False)
        detections = results[0].boxes

        output = []
        for det in detections:
            cls_id = int(det.cls.item())
            conf = float(det.conf.item())
            coords = det.xyxy.cpu().numpy().squeeze()
            xmin, ymin, xmax, ymax = coords.astype(int)
            label = labels[cls_id]

            if conf > 0.5:
                output.append({
                    "name": label,
                    "confidence": conf,
                    "xmin": 120,
                    "ymin": 90,
                    "xmax": 240,
                    "ymax": 200
                })

        return jsonify(output)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def create_data_yaml(path_to_classes_txt, path_to_data_yaml):

  # Read class.txt to get class names
  if not os.path.exists(path_to_classes_txt):
    print(f'classes.txt file not found! Please create a classes.txt labelmap and move it to {path_to_classes_txt}')
    return
  with open(path_to_classes_txt, 'r') as f:
    classes = []
    for line in f.readlines():
      if len(line.strip()) == 0: continue
      classes.append(line.strip())
  number_of_classes = len(classes)

  # Create data dictionary
  data = {
      'path': '/content/data',
      'train': 'train/images',
      'val': 'validation/images',
      'nc': number_of_classes,
      'names': classes
  }

  # Write data to YAML file
  with open(path_to_data_yaml, 'w') as f:
    yaml.dump(data, f, sort_keys=False)
  print(f'Created config file at {path_to_data_yaml}')

  return

# Define path to classes.txt and run function
path_to_classes_txt = '/content/custom_data/classes.txt'
path_to_data_yaml = '/content/data.yaml'

create_data_yaml(path_to_classes_txt, path_to_data_yaml)

print('\nFile contents:\n')

if __name__ == '__main__':
    app.run(debug=True)
# Python function to automatically create data.yaml config file
# 1. Reads "classes.txt" file to get list of class names
# 2. Creates data dictionary with correct paths to folders, number of classes, and names of classes
# 3. Writes data in YAML format to data.yaml

