# Image Authenticity Detection using EfficientNet-B0 (PyTorch)

This project is a deep learning–based web application that detects whether an uploaded image is AI-generated (deepfake) or real. The system uses an EfficientNet-B0 model implemented in PyTorch and serves predictions through a FastAPI backend.

---

## Project Overview
With the rapid advancement of generative AI models, distinguishing real images from synthetic ones has become increasingly challenging. This project addresses the problem by training a convolutional neural network to identify visual artifacts and patterns commonly found in AI-generated images.

The trained model is deployed as a REST API, allowing easy integration with a frontend or other services.

---

## Key Features
- Binary classification of images (Real vs AI-generated)
- EfficientNet-B0 model trained using PyTorch
- FastAPI-based inference service
- Image preprocessing with ImageNet normalization
- Lightweight and extensible backend design

---

## Model Architecture
- Architecture: EfficientNet-B0  
- Framework: PyTorch  
- Model source: timm library  
- Task: Binary image classification  
- Input size: 224 × 224 RGB images  

The model is loaded at application startup and runs inference in evaluation mode.

---

## Dataset
The model was trained using the **OpenFake** dataset provided by ComplexDataLab.

Dataset link:  
https://huggingface.co/datasets/ComplexDataLab/OpenFake

The dataset contains a diverse collection of real images and AI-generated images produced using multiple generative techniques, making it suitable for deepfake and synthetic image detection research.

The dataset is not included in this repository due to size and licensing constraints.

---

## Performance
| Metric    | Score |
|----------|-------|
| Accuracy | 80%   |
| F1-Score | 80%   |

Model performance may vary depending on image quality and the type of generative model used to create synthetic images.

---

## Technology Stack
- Python  
- PyTorch  
- timm  
- FastAPI  
- Torchvision  
- PIL  
- NumPy  

---

## API Endpoints
- `GET /`  
  Returns service information and available endpoints.

- `GET /health`  
  Health check endpoint to verify model status.

- `POST /predict`  
  Upload an image to receive a prediction indicating whether the image is real or AI-generated, along with confidence scores.

---

## Inference Workflow
1. Image is uploaded through the API  
2. Image is converted to RGB and resized  
3. Image is normalized using ImageNet statistics  
4. EfficientNet-B0 performs feature extraction and classification  
5. Prediction and confidence scores are returned as JSON  

---

## Future Improvements
- GPU support for faster inference  
- Video deepfake detection using keyframe extraction  
- Training with newer generative models  
- Multi-class classification for source attribution  
- Performance optimization and accuracy improvements  

---

## Disclaimer
This project is intended for educational and research purposes only. The predictions should not be used as definitive evidence in legal or forensic contexts.

---

## Author
Uday Dewani
