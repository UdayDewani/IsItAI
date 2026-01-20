"""
Deepfake Detection Model Service

A FastAPI microservice that provides deepfake detection for images using 
EfficientNet-B0 trained with timm.
"""

import os
import io
import torch
import torch.nn as nn
import timm
from torchvision import transforms
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np

# Configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "best_effnetb0.pth")
IMAGE_SIZE = (224, 224)  # EfficientNet-B0 input size
DEVICE = torch.device("cpu")  # CPU only

# Global model variable
model = None


def create_model(num_classes=2):
    """Create EfficientNet-B0 model using timm (matching training architecture)."""
    model = timm.create_model('efficientnet_b0', pretrained=False, num_classes=num_classes)
    return model


def load_model():
    """Load the trained PyTorch model."""
    global model
    
    try:
        print(f"Loading model from: {MODEL_PATH}")
        print(f"Using device: {DEVICE}")
        
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        model = create_model(num_classes=2)
        
        # Load state dict
        state_dict = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
        model.load_state_dict(state_dict)
        
        model.to(DEVICE)
        model.eval()
        
        print("Model loaded successfully!")
        return True
        
    except Exception as e:
        print(f"Error loading model: {e}")
        raise e


# Image preprocessing pipeline (ImageNet normalization)
preprocess = transforms.Compose([
    transforms.Resize(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def predict_image(image: Image.Image) -> dict:
    """
    Run deepfake detection on an image.
    
    Returns:
        dict with is_fake, confidence, and label
    """
    global model
    
    if model is None:
        raise RuntimeError("Model not loaded")
    
    # Convert to RGB if necessary
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    # Preprocess
    img_tensor = preprocess(image).unsqueeze(0).to(DEVICE)
    
    # Inference
    with torch.no_grad():
        outputs = model(img_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        
        # Assuming: index 0 = real, index 1 = fake
        fake_prob = probabilities[0][1].item()
        real_prob = probabilities[0][0].item()
    
    is_fake = fake_prob > 0.5
    confidence = fake_prob if is_fake else real_prob
    label = "FAKE" if is_fake else "REAL"
    
    return {
        "is_fake": is_fake,
        "confidence": round(confidence, 4),
        "label": label,
        "probabilities": {
            "real": round(real_prob, 4),
            "fake": round(fake_prob, 4)
        }
    }


# Create FastAPI app
app = FastAPI(
    title="Deepfake Detection API",
    description="Upload an image to detect if it's a deepfake",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    load_model()


@app.get("/")
async def root():
    """Root endpoint with service info."""
    return {
        "service": "Deepfake Detection API",
        "status": "running",
        "model": "EfficientNet-B0 (timm)",
        "endpoints": {
            "predict": "POST /predict - Upload image for analysis",
            "health": "GET /health - Health check"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(DEVICE)
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Analyze an image for deepfake detection.
    
    Returns:
        - is_fake: boolean (true if likely deepfake)
        - confidence: float 0-1 
        - label: "FAKE" or "REAL"
        - probabilities: detailed probabilities for each class
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPEG, PNG, etc.)"
        )
    
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Run prediction
        result = predict_image(image)
        
        return {
            "success": True,
            "filename": file.filename,
            **result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
